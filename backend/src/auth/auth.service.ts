import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { BindDeviceDto } from './dto/bind-device.dto.js';
import { CheckDeviceDto } from './dto/check-device.dto.js';
import { MfaVerifyDto } from './dto/mfa-verify.dto.js';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { generateSecret, verifySync, generateURI } from 'otplib';
import { verifyDeviceSignature } from '../common/crypto/device-crypto.js';

@Injectable()
export class AuthService {
  // Map lưu trữ challenge thử thách đăng nhập (Username:Challenge -> ExpirationTimestamp)
  // Đảm bảo thử thách chỉ dùng 1 lần (Single-use), chống phát lại (Anti-replay), TTL = 3 phút
  private activeChallenges = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createChallenge(username: string): string {
    const challenge = crypto.randomBytes(32).toString('hex');
    const key = `${username.trim().toLowerCase()}:${challenge}`;
    this.activeChallenges.set(key, Date.now() + 3 * 60 * 1000);
    return challenge;
  }

  verifyAndConsumeChallenge(username: string, challenge: string): boolean {
    const key = `${username.trim().toLowerCase()}:${challenge}`;
    const expiresAt = this.activeChallenges.get(key);
    if (!expiresAt) return false;
    this.activeChallenges.delete(key); // Dùng 1 lần duy nhất, chống replay
    return Date.now() <= expiresAt;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // 1. REGISTER (Blocked for public)
  async register(dto: RegisterDto) {
    throw new ForbiddenException(
      'Hệ thống nội bộ không mở đăng ký công khai. Vui lòng liên hệ Quản trị viên (Admin) để được cấp tài khoản.',
    );
  }

  // 2. PRE-LOGIN DEVICE CHECK
  async checkDevice(dto: CheckDeviceDto) {
    const normalizedUsername = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        username: { equals: normalizedUsername, mode: 'insensitive' },
      },
      include: {
        devices: {
          where: { isTrusted: true },
        },
      },
    });

    if (!user || user.deletedAt || !user.isActive) {
      // Don't leak details, return generic challenge
      return {
        status: 'READY',
        challenge: this.createChallenge(normalizedUsername),
      };
    }

    if (user.role === Role.ADMIN) {
      return {
        status: 'ADMIN',
        isTotpEnabled: user.isTotpEnabled,
        challenge: this.createChallenge(normalizedUsername),
      };
    }

    // USER Role: Check active trusted device
    const activeDevice = user.devices[0];

    if (!activeDevice) {
      return {
        status: 'AUTO_BIND',
        message: 'Thiết bị này sẽ được tự động liên kết khi đăng nhập thành công.',
        challenge: this.createChallenge(normalizedUsername),
      };
    }

    if (dto.deviceId && dto.deviceId === activeDevice.deviceId) {
      return {
        status: 'DEVICE_MATCH',
        deviceId: activeDevice.deviceId,
        deviceName: activeDevice.deviceName,
        challenge: this.createChallenge(normalizedUsername),
      };
    }

    return {
      status: 'DEVICE_MISMATCH',
      registeredDeviceName: activeDevice.deviceName,
      message: `Tài khoản đã được liên kết với thiết bị "${activeDevice.deviceName}". Thiết bị hiện tại chưa được cấp quyền.`,
      challenge: this.createChallenge(normalizedUsername),
    };
  }

  // 3. BIND DEVICE (First-time or after Admin Reset)
  async bindDevice(dto: BindDeviceDto, userAgent?: string, ipAddress?: string) {
    const normalizedUsername = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        username: { equals: normalizedUsername, mode: 'insensitive' },
      },
      include: {
        devices: { where: { isTrusted: true } },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new UnauthorizedException(
        `Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${remainingMinutes} phút.`,
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị vô hiệu hóa');
    }

    // Verify Password
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    // Verify Activation Code
    const cleanCode = dto.activationCode.trim().toUpperCase();
    const activation = await this.prisma.activationCode.findFirst({
      where: {
        userId: user.id,
        code: cleanCode,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!activation) {
      throw new UnauthorizedException(
        'Mã kích hoạt không hợp lệ, đã hết hạn hoặc đã được sử dụng. Vui lòng liên hệ Quản trị viên để nhận mã mới.',
      );
    }

    // Verify Cryptographic Signature
    const isSignatureValid = verifyDeviceSignature(
      dto.publicKey,
      dto.challenge,
      dto.signature,
    );
    if (!isSignatureValid) {
      throw new UnauthorizedException(
        'Xác thực chữ ký số thiết bị thất bại. Vui lòng thử lại.',
      );
    }

    // Atomic Transaction: Bind device, consume code, revoke old sessions, create 1 active session
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Check if user already has an active trusted device
      const existingActiveDevice = await tx.userDevice.findFirst({
        where: { userId: user.id, isTrusted: true },
      });

      if (existingActiveDevice) {
        // If an old device exists, revoke it
        await tx.userDevice.update({
          where: { id: existingActiveDevice.id },
          data: {
            isTrusted: false,
            revokedAt: new Date(),
            revokedBy: 'SYSTEM_DEVICE_TRANSFER',
          },
        });
      }

      // 2. Create or update UserDevice
      const device = await tx.userDevice.upsert({
        where: { deviceId: dto.deviceId },
        create: {
          userId: user.id,
          deviceId: dto.deviceId,
          deviceName: dto.deviceName || 'Trình duyệt Web',
          publicKey: dto.publicKey,
          isTrusted: true,
          lastSeenAt: new Date(),
        },
        update: {
          userId: user.id,
          deviceName: dto.deviceName || 'Trình duyệt Web',
          publicKey: dto.publicKey,
          isTrusted: true,
          lastSeenAt: new Date(),
          revokedAt: null,
          revokedBy: null,
        },
      });

      // 3. Mark activation code as used
      await tx.activationCode.update({
        where: { id: activation.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      // 4. Reset failed attempts
      if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
        await tx.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockoutUntil: null },
        });
      }

      // 5. Revoke ALL active sessions for this user (Strict Single Session guarantee)
      await tx.session.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // 6. Create the single active session
      const session = await tx.session.create({
        data: {
          userId: user.id,
          deviceId: device.deviceId,
          userAgent,
          ipAddress,
        },
      });

      return { session, device };
    });

    // Generate Tokens
    const { accessToken, rawRefreshToken } = await this.generateTokens(
      user.id,
      user.username,
      user.role,
      result.session.id,
    );

    return {
      accessToken,
      rawRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      },
      device: {
        deviceId: result.device.deviceId,
        deviceName: result.device.deviceName,
      },
    };
  }

  // 4. LOGIN (Single Trusted Device + Proof of Possession + Single Active Session)
  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const normalizedUsername = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        username: { equals: normalizedUsername, mode: 'insensitive' },
      },
      include: {
        devices: { where: { isTrusted: true } },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new UnauthorizedException(
        `Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${remainingMinutes} phút.`,
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị vô hiệu hóa');
    }

    // Verify Password
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    // Check if user is ADMIN
    if (user.role === Role.ADMIN) {
      // Check MFA if enabled
      if (user.isTotpEnabled && user.totpSecret) {
        const mfaTicket = await this.jwtService.signAsync(
          { sub: user.id, purpose: 'MFA_VERIFY' },
          { expiresIn: '5m' },
        );
        return {
          mfaRequired: true,
          mfaTicket,
        };
      }

      // Admin without TOTP or TOTP disabled -> Direct session creation
      return this.createUserSession(user, undefined, userAgent, ipAddress);
    }

    // ==================== USER DEVICE CHECK ====================
    const activeDevice = user.devices[0];

    // CASE 1: FIRST LOGIN HOẶC SAU KHI ADMIN RESET (TỰ ĐỘNG LIÊN KẾT THIẾT BỊ)
    if (!activeDevice) {
      if (!dto.deviceId) {
        throw new BadRequestException('Không nhận diện được định danh thiết bị trình duyệt.');
      }
      const deviceId: string = dto.deviceId;

      // Nếu client gửi chữ ký số thử thách, xác thực khóa công khai và chống phát lại
      if (dto.publicKey && dto.challenge && dto.signature) {
        const isChallengeValid = this.verifyAndConsumeChallenge(
          normalizedUsername,
          dto.challenge,
        );
        if (!isChallengeValid) {
          throw new UnauthorizedException(
            'Thử thách xác thực thiết bị không hợp lệ, đã hết hạn hoặc đã được sử dụng.',
          );
        }

        const isSigOk = verifyDeviceSignature(
          dto.publicKey,
          dto.challenge,
          dto.signature,
        );
        if (!isSigOk) {
          throw new UnauthorizedException('Xác thực chữ ký số thiết bị không thành công.');
        }
      }

      // Atomic Transaction: Chống race condition 2 request đồng thời chiếm liên kết đầu tiên
      const result = await this.prisma.$transaction(async (tx) => {
        // Kiểm tra lại trong transaction: Nếu một request song song đã liên kết trước đó -> CHẶN
        const concurrentDevice = await tx.userDevice.findFirst({
          where: { userId: user.id, isTrusted: true },
        });
        if (concurrentDevice) {
          throw new UnauthorizedException(
            `Tài khoản đã được liên kết với thiết bị "${concurrentDevice.deviceName}". Mỗi tài khoản chỉ được phép dùng trên 1 thiết bị duy nhất.`,
          );
        }

        // Tự động liên kết trình duyệt hiện tại làm thiết bị tin cậy duy nhất
        const newDevice = await tx.userDevice.upsert({
          where: { deviceId },
          create: {
            userId: user.id,
            deviceId,
            deviceName: dto.deviceName || 'Trình duyệt Web',
            publicKey: dto.publicKey || '',
            isTrusted: true,
            lastSeenAt: new Date(),
          },
          update: {
            userId: user.id,
            deviceName: dto.deviceName || 'Trình duyệt Web',
            publicKey: dto.publicKey || '',
            isTrusted: true,
            lastSeenAt: new Date(),
            revokedAt: null,
            revokedBy: null,
          },
        });

        // Thu hồi toàn bộ phiên trước đó (Đảm bảo tối đa 1 phiên hoạt động)
        await tx.session.updateMany({
          where: { userId: user.id, isRevoked: false },
          data: { isRevoked: true, revokedAt: new Date() },
        });

        // Đặt lại số lần đăng nhập sai
        if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
          await tx.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockoutUntil: null },
          });
        }

        // Tạo 1 phiên đăng nhập duy nhất
        const session = await tx.session.create({
          data: {
            userId: user.id,
            deviceId: newDevice.deviceId,
            userAgent,
            ipAddress,
          },
        });

        return { session, device: newDevice };
      });

      const { accessToken, rawRefreshToken } = await this.generateTokens(
        user.id,
        user.username,
        user.role,
        result.session.id,
      );

      return {
        accessToken,
        rawRefreshToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName,
        },
        device: {
          deviceId: result.device.deviceId,
          deviceName: result.device.deviceName,
        },
      };
    }

    // CASE 2: ĐÃ CÓ THIẾT BỊ TIN CẬY -> TRÌNH DUYỆT KHÁC BỊ TỪ CHỐI
    if (!dto.deviceId || dto.deviceId !== activeDevice.deviceId) {
      throw new UnauthorizedException(
        `Thiết bị này chưa được liên kết với tài khoản. Mỗi tài khoản chỉ được phép sử dụng trên 1 thiết bị tin cậy duy nhất (đã liên kết với "${activeDevice.deviceName}"). Vui lòng liên hệ Quản trị viên để được hỗ trợ chuyển thiết bị.`,
      );
    }

    // Xác thực chữ ký số thiết bị đã liên kết và chống phát lại
    if (dto.challenge && dto.signature && activeDevice.publicKey) {
      const isChallengeValid = this.verifyAndConsumeChallenge(
        normalizedUsername,
        dto.challenge,
      );
      if (!isChallengeValid) {
        throw new UnauthorizedException(
          'Thử thách xác thực thiết bị không hợp lệ, đã hết hạn hoặc đã được sử dụng.',
        );
      }

      const isSigOk = verifyDeviceSignature(
        activeDevice.publicKey,
        dto.challenge,
        dto.signature,
      );
      if (!isSigOk) {
        throw new UnauthorizedException('Xác thực chữ ký số thiết bị không thành công.');
      }
    }

    // Cập nhật thời điểm hoạt động gần nhất
    await this.prisma.userDevice.update({
      where: { id: activeDevice.id },
      data: { lastSeenAt: new Date() },
    });

    return this.createUserSession(user, activeDevice.deviceId, userAgent, ipAddress);
  }

  // 5. Helper: Create Single Active Session (Revoke all prior sessions)
  private async createUserSession(
    user: any,
    deviceId?: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const session = await this.prisma.$transaction(async (tx) => {
      // 1. Reset failed attempts
      if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
        await tx.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockoutUntil: null },
        });
      }

      // 2. Revoke ALL existing active sessions for this user
      await tx.session.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // 3. Create the single new active session
      return tx.session.create({
        data: {
          userId: user.id,
          deviceId,
          userAgent,
          ipAddress,
        },
      });
    });

    // 4. Generate Tokens
    const { accessToken, rawRefreshToken } = await this.generateTokens(
      user.id,
      user.username,
      user.role,
      session.id,
    );

    return {
      accessToken,
      rawRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  // 6. ADMIN MFA: Setup, Enable, Verify
  async adminMfaSetup(adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Quản trị viên mới có quyền thiết lập MFA');
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      secret,
      label: admin.username,
      issuer: 'HeThongOnTap',
    });

    return { secret, otpauthUrl };
  }

  async adminMfaEnable(adminId: string, secret: string, totpCode: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Quản trị viên mới có quyền bật MFA');
    }

    const result = verifySync({ token: totpCode.trim(), secret });
    if (!result || !result.valid) {
      throw new BadRequestException('Mã TOTP không chính xác hoặc đã hết hạn');
    }

    await this.prisma.user.update({
      where: { id: adminId },
      data: {
        totpSecret: secret,
        isTotpEnabled: true,
      },
    });

    return { message: 'Đã kích hoạt xác thực 2 bước (TOTP MFA) thành công' };
  }

  async adminMfaDisable(adminId: string, totpCode: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Quản trị viên mới có quyền tắt MFA');
    }

    if (admin.isTotpEnabled && admin.totpSecret) {
      const result = verifySync({ token: totpCode.trim(), secret: admin.totpSecret });
      if (!result || !result.valid) {
        throw new BadRequestException('Mã xác thực không đúng');
      }
    }

    await this.prisma.user.update({
      where: { id: adminId },
      data: {
        totpSecret: null,
        isTotpEnabled: false,
      },
    });

    return { message: 'Đã tắt xác thực 2 bước thành công' };
  }

  async mfaVerify(dto: MfaVerifyDto, userAgent?: string, ipAddress?: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(dto.mfaTicket);
    } catch {
      throw new UnauthorizedException('Phiên xác thực MFA đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (!payload || payload.purpose !== 'MFA_VERIFY' || !payload.sub) {
      throw new UnauthorizedException('Ticket xác thực không hợp lệ');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || !admin.isActive || admin.deletedAt || !admin.totpSecret) {
      throw new UnauthorizedException('Không tìm thấy cấu hình MFA cho tài khoản');
    }

    const result = verifySync({
      token: dto.totpCode.trim(),
      secret: admin.totpSecret,
    });

    if (!result || !result.valid) {
      throw new UnauthorizedException('Mã TOTP 6 số không chính xác');
    }

    return this.createUserSession(admin, undefined, userAgent, ipAddress);
  }

  // 7. REFRESH TOKEN (Rotation & Reuse Detection)
  async refreshToken(rawToken: string, userAgent?: string, ipAddress?: string) {
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token không tồn tại');
    }

    const tokenHash = this.hashToken(rawToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        session: true,
        user: true,
      },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (tokenRecord.isUsed) {
      await this.prisma.session.update({
        where: { id: tokenRecord.sessionId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
      throw new UnauthorizedException(
        'Phát hiện token bị tái sử dụng. Phiên đăng nhập đã bị hủy vì lý do bảo mật. Vui lòng đăng nhập lại.',
      );
    }

    if (tokenRecord.session.isRevoked) {
      throw new UnauthorizedException('Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        isUsed: true,
        revokedAt: new Date(),
      },
    });

    const { accessToken, rawRefreshToken } = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.username,
      tokenRecord.user.role,
      tokenRecord.sessionId,
    );

    return {
      accessToken,
      rawRefreshToken,
      user: {
        id: tokenRecord.user.id,
        username: tokenRecord.user.username,
        role: tokenRecord.user.role,
        fullName: tokenRecord.user.fullName,
      },
    };
  }

  // 8. LOGOUT & REVOCATION
  async logout(sessionId?: string, rawRefreshToken?: string) {
    if (sessionId) {
      await this.prisma.session.updateMany({
        where: { id: sessionId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
    }

    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      const record = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      if (record) {
        await this.prisma.session.updateMany({
          where: { id: record.sessionId },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
          },
        });
      }
    }

    return { message: 'Đăng xuất thành công, phiên làm việc đã được thu hồi' };
  }

  // 9. GET ME
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        isTotpEnabled: true,
        deviceTransferCount: true,
        createdAt: true,
        devices: {
          where: { isTrusted: true },
          select: {
            deviceId: true,
            deviceName: true,
            lastSeenAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return user;
  }

  // 10. CHANGE PASSWORD (Blocked for regular users)
  async changePassword() {
    throw new ForbiddenException(
      'Hệ thống không cho phép người dùng tự đổi mật khẩu. Chỉ Quản trị viên (Admin) mới có quyền đặt lại mật khẩu.',
    );
  }

  // Helpers
  private async handleFailedLogin(user: any) {
    const failedAttempts = user.failedLoginAttempts + 1;
    const lockoutUntil =
      failedAttempts >= 5
        ? new Date(Date.now() + 15 * 60 * 1000)
        : null;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: failedAttempts,
        lockoutUntil,
      },
    });
  }

  private async generateTokens(
    userId: string,
    username: string,
    role: Role,
    sessionId: string,
  ) {
    const accessExpiration =
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';

    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        username,
        role,
        sessionId,
      },
      {
        expiresIn: accessExpiration as any,
      },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        sessionId,
        userId,
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, rawRefreshToken };
  }
}
