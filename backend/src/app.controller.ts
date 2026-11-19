import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async getHealth() {
    let dbStatus = 'disconnected';
    let dbLatencyMs = 0;

    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      dbLatencyMs = Date.now() - start;
    } catch (err: any) {
      dbStatus = `error: ${err?.message || 'unknown error'}`;
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'he-thong-on-tap-api',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        provider: 'postgresql',
        latencyMs: dbLatencyMs,
      },
    };
  }
}
