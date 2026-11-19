import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  username: string;
  role: 'ADMIN' | 'USER';
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ||
        'dev-super-secret-key-for-access-token-ontap-2026',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    return {
      id: payload.sub,
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}

