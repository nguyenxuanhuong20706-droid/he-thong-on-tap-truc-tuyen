import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Request } from 'express';
import { Role } from '@prisma/client';

@Controller('subjects')
export class SubjectsController {
  constructor(
    private readonly subjectsService: SubjectsService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private async extractUserFromHeader(
    req: Request,
  ): Promise<{ id: string; role: Role } | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    try {
      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.decode(token) as any;
      if (!payload || !payload.sub || !payload.sessionId) {
        return null;
      }

      // Check session revocation in database
      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
        include: { user: true, device: true },
      });

      if (!session || session.isRevoked) {
        return null;
      }

      if (!session.user || !session.user.isActive || session.user.deletedAt) {
        return null;
      }

      if (session.device && !session.device.isTrusted) {
        return null;
      }

      return { id: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = await this.extractUserFromHeader(req);
    return this.subjectsService.findAll(user?.id, user?.role);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string, @Req() req: Request) {
    const user = await this.extractUserFromHeader(req);
    return this.subjectsService.findBySlug(slug, user?.id, user?.role);
  }
}
