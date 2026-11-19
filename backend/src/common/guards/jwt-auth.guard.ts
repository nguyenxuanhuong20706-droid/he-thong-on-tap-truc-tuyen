import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verify JWT signature & expiration via Passport JWT
    const isValidJwt = (await super.canActivate(context)) as boolean;
    if (!isValidJwt) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    // 2. Extract user & sessionId from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sessionId) {
      throw new UnauthorizedException('Phiên đăng nhập không tồn tại');
    }

    // 3. Check session revocation, user status, and device validity in database
    const session = await this.prisma.session.findUnique({
      where: { id: user.sessionId },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
            deletedAt: true,
            role: true,
          },
        },
        device: {
          select: {
            deviceId: true,
            isTrusted: true,
          },
        },
      },
    });

    if (!session || session.isRevoked) {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã bị thu hồi hoặc đã đăng xuất. Vui lòng đăng nhập lại.',
      );
    }

    if (!session.user || !session.user.isActive || session.user.deletedAt) {
      throw new UnauthorizedException(
        'Tài khoản của bạn đã bị vô hiệu hóa hoặc không còn hoạt động.',
      );
    }

    // If session is bound to a device and device was revoked by Admin
    if (session.device && !session.device.isTrusted) {
      throw new UnauthorizedException(
        'Thiết bị này đã bị hủy liên kết bởi Quản trị viên. Vui lòng liên hệ Quản trị viên.',
      );
    }

    return true;
  }
}
