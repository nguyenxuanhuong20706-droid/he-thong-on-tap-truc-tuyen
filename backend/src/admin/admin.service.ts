import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccessType, Role, AuditAction } from '@prisma/client';
import { AdminCreateUserDto } from './dto/create-user.dto.js';
import { AdminCreateSubjectDto } from './dto/create-subject.dto.js';
import { AdminCreateLessonDto } from './dto/create-lesson.dto.js';
import { AdminCreateQuestionDto } from './dto/create-question.dto.js';
import * as argon2 from 'argon2';
import { generateActivationCode } from '../common/crypto/device-crypto.js';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 1. DASHBOARD OVERVIEW ====================
  async getDashboard(adminUsername: string) {
    const totalUsers = await this.prisma.user.count({
      where: { role: Role.USER },
    });
    const activeUsers = await this.prisma.user.count({
      where: { role: Role.USER, isActive: true },
    });
    const activeSessions = await this.prisma.session.count({
      where: { isRevoked: false },
    });
    const totalSubjects = await this.prisma.subject.count();
    const totalLessons = await this.prisma.lesson.count();
    const totalQuestions = await this.prisma.question.count();
    const totalQuizAttempts = await this.prisma.quizAttempt.count();
    const totalGrantedAccess = await this.prisma.userSubjectAccess.count({
      where: { isActive: true },
    });
    const totalAuditLogs = await this.prisma.accessAuditLog.count();

    return {
      message: 'Chào mừng Quản trị viên đến với Admin Dashboard',
      adminUser: adminUsername,
      statistics: {
        totalUsers,
        activeUsers,
        activeSessions,
        totalSubjects,
        totalLessons,
        totalQuestions,
        totalQuizAttempts,
        totalGrantedAccess,
        totalAuditLogs,
      },
    };
  }

  // ==================== 2. USER MANAGEMENT ====================
  async listUsers(search?: string) {
    const where: any = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        deviceTransferCount: true,
        isTotpEnabled: true,
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
        sessions: {
          where: { isRevoked: false },
          select: { id: true, createdAt: true },
        },
        _count: {
          select: {
            quizAttempts: true,
            userSubjectAccess: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      deviceTransferCount: u.deviceTransferCount,
      isTotpEnabled: u.isTotpEnabled,
      activeDevice: u.devices[0] || null,
      hasActiveSession: u.sessions.length > 0,
      createdAt: u.createdAt,
      attemptCount: u._count.quizAttempts,
      activeSubjectCount: u._count.userSubjectAccess,
    }));
  }

  async createUser(dto: AdminCreateUserDto, adminId?: string) {
    const normalizedUsername = dto.username.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: {
        username: {
          equals: normalizedUsername,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException('Tên đăng nhập đã tồn tại trong hệ thống');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: normalizedUsername,
          passwordHash,
          fullName: dto.fullName?.trim() || null,
          role: Role.USER,
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Generate initial activation code valid for 48 hours
      const code = generateActivationCode();
      const creatorId = adminId || user.id;
      const activation = await tx.activationCode.create({
        data: {
          code,
          userId: user.id,
          createdById: creatorId,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      return { user, activationCode: activation.code };
    });

    return {
      message: 'Tạo tài khoản học viên thành công (0 môn học mặc định)',
      user: result.user,
      activationCode: result.activationCode,
    };
  }

  async updateUser(userId: string, data: { fullName?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName !== undefined ? data.fullName.trim() : user.fullName,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    return {
      message: 'Cập nhật thông tin tài khoản thành công',
      user: updated,
    };
  }

  async resetUserPassword(userId: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('Mật khẩu mới tối thiểu 6 ký tự');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const passwordHash = await argon2.hash(newPass, {
      type: argon2.argon2id,
    });

    // 1. Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, failedLoginAttempts: 0, lockoutUntil: null },
    });

    // 2. Revoke ALL active sessions of this user immediately
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    return {
      message: `Đã đặt lại mật khẩu cho tài khoản ${user.username} và thu hồi toàn bộ phiên đăng nhập hiện tại`,
    };
  }

  async toggleUserActive(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (!isActive && user.role === Role.ADMIN) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true, deletedAt: null },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException('Không thể vô hiệu hóa Quản trị viên duy nhất còn lại của hệ thống');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    // If deactivated, revoke all active sessions immediately
    if (!isActive) {
      await this.prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    }

    return {
      message: `Đã ${isActive ? 'kích hoạt' : 'khóa'} tài khoản ${user.username}`,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (user.role === Role.ADMIN) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException('Không thể xóa Quản trị viên duy nhất của hệ thống');
      }
    }

    // Hard delete directly from DB (cascades sessions, tokens, subject accesses, quiz attempts)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: `Đã xóa hoàn toàn tài khoản "${user.username}" khỏi cơ sở dữ liệu và hệ thống`,
    };
  }

  // ==================== DEVICE MANAGEMENT (1 USER = 1 THIẾT BỊ) ====================
  async resetDevice(
    userId: string,
    dto: { transferType: 'TRANSFER' | 'RECOVERY'; reason: string },
    admin: AuthenticatedUser,
  ) {
    if (!dto.reason || dto.reason.trim().length < 3) {
      throw new BadRequestException(
        'Vui lòng nhập lý do chuyển/đặt lại thiết bị (tối thiểu 3 ký tự)',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        devices: { where: { isTrusted: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const oldDevice = user.devices[0];

    return this.prisma.$transaction(async (tx) => {
      // 1. Revoke existing device if present
      if (oldDevice) {
        await tx.userDevice.update({
          where: { id: oldDevice.id },
          data: {
            isTrusted: false,
            revokedAt: new Date(),
            revokedBy: admin.username,
          },
        });
      }

      // 2. Revoke all active sessions of this user immediately
      await tx.session.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // 3. Increment transfer count only if transferType === 'TRANSFER'
      const isTransfer = dto.transferType === 'TRANSFER';
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          deviceTransferCount: isTransfer
            ? user.deviceTransferCount + 1
            : user.deviceTransferCount,
        },
      });

      // 4. Generate new Activation Code (valid for 24 hours)
      const code = generateActivationCode();
      const activation = await tx.activationCode.create({
        data: {
          code,
          userId: user.id,
          createdById: admin.userId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // 5. Record Audit Log
      await tx.deviceTransferAudit.create({
        data: {
          userId: user.id,
          oldDeviceId: oldDevice?.deviceId || null,
          transferredByAdminId: admin.userId,
          transferType: dto.transferType,
          reason: dto.reason.trim(),
        },
      });

      return {
        message: `Đã đặt lại thiết bị cho tài khoản ${user.username}`,
        activationCode: activation.code,
        transferCount: updatedUser.deviceTransferCount,
        isWarning: updatedUser.deviceTransferCount >= 2,
      };
    });
  }

  async revokeUserSession(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    return {
      message: `Đã thu hồi phiên đăng nhập của tài khoản ${user.username}. Thiết bị tin cậy vẫn được giữ nguyên.`,
    };
  }

  async getDeviceTransferAudits(userId?: string) {
    return this.prisma.deviceTransferAudit.findMany({
      where: userId ? { userId } : {},
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        admin: { select: { id: true, username: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ==================== 3. SUBJECT ACCESS MANAGEMENT & AUDIT LOGS ====================
  async getUserAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, fullName: true, role: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const subjects = await this.prisma.subject.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    const activeAccesses = await this.prisma.userSubjectAccess.findMany({
      where: { userId, isActive: true },
    });

    const accessMap = new Map(activeAccesses.map((a) => [a.subjectId, a]));

    return {
      user,
      subjects: subjects.map((s) => {
        const acc = accessMap.get(s.id);
        return {
          subjectId: s.id,
          slug: s.slug,
          title: s.title,
          hasAccess: !!acc,
          grantedAt: acc?.grantedAt || null,
          expiresAt: acc?.expiresAt || null,
        };
      }),
    };
  }

  async setUserAccess(
    userId: string,
    subjectIds: string[],
    adminUser: { userId: string; username: string },
    note?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const allSubjects = await this.prisma.subject.findMany();
    const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));

    const currentAccesses = await this.prisma.userSubjectAccess.findMany({
      where: { userId, isActive: true },
    });

    const currentSubjectIds = currentAccesses.map((a) => a.subjectId);
    const toAdd = subjectIds.filter((id) => !currentSubjectIds.includes(id));
    const toRemove = currentSubjectIds.filter((id) => !subjectIds.includes(id));

    // Grant new subjects
    for (const subId of toAdd) {
      const sub = subjectMap.get(subId);
      if (!sub) continue;

      await this.prisma.userSubjectAccess.upsert({
        where: { userId_subjectId: { userId, subjectId: subId } },
        update: {
          isActive: true,
          accessType: AccessType.ADMIN_GRANT,
          grantedById: adminUser.userId,
          grantedAt: new Date(),
          revokedAt: null,
          revokedById: null,
          expiresAt: null,
        },
        create: {
          userId,
          subjectId: subId,
          accessType: AccessType.ADMIN_GRANT,
          isActive: true,
          grantedById: adminUser.userId,
          grantedAt: new Date(),
          expiresAt: null,
        },
      });

      // Audit Log
      await this.prisma.accessAuditLog.create({
        data: {
          adminId: adminUser.userId,
          adminName: adminUser.username,
          userId: user.id,
          userName: user.username,
          subjectId: sub.id,
          subjectTitle: sub.title,
          action: AuditAction.GRANT,
          note: note || 'Cấp quyền truy cập trực tiếp từ Admin Dashboard',
        },
      });
    }

    // Revoke removed subjects
    for (const subId of toRemove) {
      const sub = subjectMap.get(subId);
      if (!sub) continue;

      await this.prisma.userSubjectAccess.updateMany({
        where: { userId, subjectId: subId },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokedById: adminUser.userId,
        },
      });

      // Audit Log
      await this.prisma.accessAuditLog.create({
        data: {
          adminId: adminUser.userId,
          adminName: adminUser.username,
          userId: user.id,
          userName: user.username,
          subjectId: sub.id,
          subjectTitle: sub.title,
          action: AuditAction.REVOKE,
          note: note || 'Thu hồi quyền truy cập từ Admin Dashboard',
        },
      });
    }

    return {
      message: `Đã cập nhật quyền truy cập môn học cho ${user.username}: Cấp mới ${toAdd.length} môn, Thu hồi ${toRemove.length} môn`,
      addedCount: toAdd.length,
      removedCount: toRemove.length,
    };
  }

  async grantAccess(
    userId: string,
    subjectId: string,
    adminUser: { userId: string; username: string },
    note?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });

    if (!user || !subject) {
      throw new NotFoundException('Không tìm thấy Người dùng hoặc Môn học');
    }

    const access = await this.prisma.userSubjectAccess.upsert({
      where: { userId_subjectId: { userId, subjectId } },
      update: {
        isActive: true,
        accessType: AccessType.ADMIN_GRANT,
        grantedById: adminUser.userId,
        grantedAt: new Date(),
        revokedAt: null,
        revokedById: null,
        expiresAt: null,
      },
      create: {
        userId,
        subjectId,
        accessType: AccessType.ADMIN_GRANT,
        isActive: true,
        grantedById: adminUser.userId,
        grantedAt: new Date(),
        expiresAt: null,
      },
    });

    await this.prisma.accessAuditLog.create({
      data: {
        adminId: adminUser.userId,
        adminName: adminUser.username,
        userId: user.id,
        userName: user.username,
        subjectId: subject.id,
        subjectTitle: subject.title,
        action: AuditAction.GRANT,
        note: note || 'Cấp quyền môn học',
      },
    });

    return {
      message: `Đã cấp quyền truy cập môn ${subject.title} cho tài khoản ${user.username}`,
      access,
    };
  }

  async revokeAccess(
    userId: string,
    subjectId: string,
    adminUser: { userId: string; username: string },
    note?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });

    if (!user || !subject) {
      throw new NotFoundException('Không tìm thấy Người dùng hoặc Môn học');
    }

    await this.prisma.userSubjectAccess.updateMany({
      where: { userId, subjectId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedById: adminUser.userId,
      },
    });

    await this.prisma.accessAuditLog.create({
      data: {
        adminId: adminUser.userId,
        adminName: adminUser.username,
        userId: user.id,
        userName: user.username,
        subjectId: subject.id,
        subjectTitle: subject.title,
        action: AuditAction.REVOKE,
        note: note || 'Thu hồi quyền truy cập môn học',
      },
    });

    return {
      message: `Đã thu hồi quyền truy cập môn ${subject.title} của tài khoản ${user.username}`,
    };
  }

  async getAuditLogs(limit = 100) {
    return this.prisma.accessAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ==================== 4. CONTENT MANAGEMENT ====================
  // --- SUBJECTS ---
  async createSubject(dto: AdminCreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Mã định danh (slug) môn học đã tồn tại');
    }

    const count = await this.prisma.subject.count();

    const subject = await this.prisma.subject.create({
      data: {
        slug: dto.slug.trim().toLowerCase(),
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        isPaid: true, // Default locked
        isPublished: dto.isPublished ?? true,
        orderIndex: dto.orderIndex ?? count + 1,
      },
    });

    return {
      message: 'Tạo môn học mới thành công',
      subject,
    };
  }

  async updateSubject(id: string, data: Partial<AdminCreateSubjectDto>) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học');

    const updated = await this.prisma.subject.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title.trim() : subject.title,
        description: data.description !== undefined ? data.description.trim() : subject.description,
        isPublished: data.isPublished !== undefined ? data.isPublished : subject.isPublished,
        orderIndex: data.orderIndex !== undefined ? data.orderIndex : subject.orderIndex,
      },
    });

    return { message: 'Cập nhật môn học thành công', subject: updated };
  }

  async togglePublishSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học');

    const updated = await this.prisma.subject.update({
      where: { id },
      data: { isPublished: !subject.isPublished },
    });

    return {
      message: `Đã ${updated.isPublished ? 'hiển thị' : 'ẩn'} môn học ${updated.title}`,
      subject: updated,
    };
  }

  // --- LESSONS ---
  async createLesson(subjectId: string, dto: AdminCreateLessonDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học');

    const existingSlug = await this.prisma.lesson.findUnique({
      where: { subjectId_slug: { subjectId, slug: dto.slug } },
    });
    if (existingSlug) {
      throw new ConflictException('Mã bài học đã tồn tại trong môn học này');
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        subjectId,
        slug: dto.slug.trim().toLowerCase(),
        title: dto.title.trim(),
        lessonNumber: dto.lessonNumber,
        description: dto.description?.trim() || null,
        isActive: dto.isActive ?? true,
      },
    });

    return { message: 'Tạo bài học mới thành công', lesson };
  }

  async updateLesson(id: string, data: Partial<AdminCreateLessonDto>) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title.trim() : lesson.title,
        description: data.description !== undefined ? data.description.trim() : lesson.description,
        lessonNumber: data.lessonNumber !== undefined ? data.lessonNumber : lesson.lessonNumber,
        isActive: data.isActive !== undefined ? data.isActive : lesson.isActive,
      },
    });

    return { message: 'Cập nhật bài học thành công', lesson: updated };
  }

  async deleteLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');

    await this.prisma.lesson.delete({ where: { id } });
    return { message: `Đã xóa bài học ${lesson.title}` };
  }

  // --- QUESTIONS & OPTIONS ---
  async getQuestions(lessonId?: string, subjectId?: string) {
    const where: any = {};
    if (lessonId) where.lessonId = lessonId;
    if (subjectId) where.subjectId = subjectId;

    return this.prisma.question.findMany({
      where,
      orderBy: { questionNumber: 'asc' },
      include: {
        options: {
          orderBy: { key: 'asc' },
        },
        lesson: {
          select: { id: true, title: true, lessonNumber: true },
        },
      },
    });
  }

  async createQuestion(dto: AdminCreateQuestionDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');

    if (!dto.options || dto.options.length < 2) {
      throw new BadRequestException('Mỗi câu hỏi phải có tối thiểu 2 đáp án');
    }

    const hasCorrect = dto.options.some((o) => o.isCorrect);
    if (!hasCorrect) {
      throw new BadRequestException('Phải chỉ định ít nhất 1 đáp án đúng');
    }

    const question = await this.prisma.question.create({
      data: {
        subjectId: dto.subjectId,
        lessonId: dto.lessonId,
        questionNumber: dto.questionNumber,
        content: dto.content.trim(),
        explanation: dto.explanation?.trim() || null,
        isActive: true,
        options: {
          create: dto.options.map((o) => ({
            key: o.key.trim().toUpperCase(),
            text: o.text.trim(),
            isCorrect: o.isCorrect,
          })),
        },
      },
      include: { options: true },
    });

    return { message: 'Thêm câu hỏi mới thành công', question };
  }

  async updateQuestion(id: string, data: any) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        content: data.content !== undefined ? data.content.trim() : question.content,
        explanation: data.explanation !== undefined ? data.explanation.trim() : question.explanation,
        questionNumber: data.questionNumber !== undefined ? data.questionNumber : question.questionNumber,
        isActive: data.isActive !== undefined ? data.isActive : question.isActive,
      },
      include: { options: true },
    });

    return { message: 'Cập nhật câu hỏi thành công', question: updated };
  }

  async deleteQuestion(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

    await this.prisma.question.delete({ where: { id } });
    return { message: 'Đã xóa câu hỏi thành công' };
  }
}
