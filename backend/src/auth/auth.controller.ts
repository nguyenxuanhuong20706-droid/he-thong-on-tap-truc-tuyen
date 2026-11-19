import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { BindDeviceDto } from './dto/bind-device.dto.js';
import { CheckDeviceDto } from './dto/check-device.dto.js';
import { MfaVerifyDto } from './dto/mfa-verify.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register() {
    throw new ForbiddenException(
      'Hệ thống nội bộ không mở đăng ký công khai. Vui lòng liên hệ Quản trị viên (Admin) để được cấp tài khoản.',
    );
  }

  @Post('check-device')
  @HttpCode(HttpStatus.OK)
  async checkDevice(@Body() dto: CheckDeviceDto) {
    return this.authService.checkDevice(dto);
  }

  @Post('bind-device')
  @HttpCode(HttpStatus.OK)
  async bindDevice(
    @Body() dto: BindDeviceDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || undefined;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || undefined;

    const result = await this.authService.bindDevice(dto, userAgent, ipAddress);

    // Set Refresh Token in HttpOnly cookie
    res.cookie('refresh_token', result.rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
      device: result.device,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || undefined;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || undefined;

    const result = await this.authService.login(dto, userAgent, ipAddress);

    if ('mfaRequired' in result && result.mfaRequired) {
      return result;
    }

    const sessionResult = result as {
      accessToken: string;
      rawRefreshToken: string;
      user: any;
    };

    res.cookie('refresh_token', sessionResult.rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      accessToken: sessionResult.accessToken,
      user: sessionResult.user,
    };
  }

  @Post('mfa-verify')
  @HttpCode(HttpStatus.OK)
  async mfaVerify(
    @Body() dto: MfaVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || undefined;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || undefined;

    const result = await this.authService.mfaVerify(dto, userAgent, ipAddress);

    res.cookie('refresh_token', result.rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // Admin MFA Management
  @Post('admin/mfa/setup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async adminMfaSetup(@CurrentUser() admin: AuthenticatedUser) {
    return this.authService.adminMfaSetup(admin.userId);
  }

  @Post('admin/mfa/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async adminMfaEnable(
    @CurrentUser() admin: AuthenticatedUser,
    @Body('secret') secret: string,
    @Body('totpCode') totpCode: string,
  ) {
    return this.authService.adminMfaEnable(admin.userId, secret, totpCode);
  }

  @Post('admin/mfa/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async adminMfaDisable(
    @CurrentUser() admin: AuthenticatedUser,
    @Body('totpCode') totpCode: string,
  ) {
    return this.authService.adminMfaDisable(admin.userId, totpCode);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken =
      req.cookies?.refresh_token ||
      (req.headers['x-refresh-token'] as string);

    const userAgent = req.headers['user-agent'] || undefined;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || undefined;

    const result = await this.authService.refreshToken(
      rawToken,
      userAgent,
      ipAddress,
    );

    res.cookie('refresh_token', result.rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken =
      req.cookies?.refresh_token ||
      (req.headers['x-refresh-token'] as string);

    let sessionId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.decode(authHeader.split(' ')[1]) as any;
        if (payload && payload.sessionId) {
          sessionId = payload.sessionId;
        }
      } catch {
        // ignore
      }
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    return this.authService.logout(sessionId, rawToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword() {
    throw new ForbiddenException(
      'Hệ thống không cho phép người dùng tự đổi mật khẩu. Chỉ Quản trị viên (Admin) mới có quyền đặt lại mật khẩu.',
    );
  }
}
