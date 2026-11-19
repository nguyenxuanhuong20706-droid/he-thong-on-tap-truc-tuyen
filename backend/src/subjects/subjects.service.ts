import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '@prisma/client';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: string, role?: Role) {
    const subjects = await this.prisma.subject.findMany({
      where: role === Role.ADMIN ? {} : { isPublished: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          where: role === Role.ADMIN ? {} : { isActive: true },
          select: {
            id: true,
            _count: {
              select: { questions: { where: { isActive: true } } },
            },
          },
        },
      },
    });

    const now = new Date();
    const accessMap = new Map<
      string,
      { isActive: boolean; expiresAt: Date | null }
    >();

    if (userId) {
      if (role === Role.ADMIN) {
        // Admin has access to all subjects
        for (const sub of subjects) {
          accessMap.set(sub.id, { isActive: true, expiresAt: null });
        }
      } else {
        const accesses = await this.prisma.userSubjectAccess.findMany({
          where: {
            userId,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          select: { subjectId: true, isActive: true, expiresAt: true },
        });

        for (const a of accesses) {
          accessMap.set(a.subjectId, {
            isActive: a.isActive,
            expiresAt: a.expiresAt,
          });
        }
      }
    }

    return subjects.map((sub) => {
      const lessonCount = sub.lessons.length;
      const questionCount = sub.lessons.reduce(
        (sum, l) => sum + l._count.questions,
        0,
      );

      let hasAccess = false;
      let isPermanent = false;
      let expiresAt: Date | null = null;
      let remainingDays: number | null = null;
      let accessBadgeText = 'Chưa được cấp quyền';

      if (role === Role.ADMIN) {
        hasAccess = true;
        isPermanent = true;
        accessBadgeText = 'Quản trị viên';
      } else {
        const userAccess = accessMap.get(sub.id);
        if (userAccess && userAccess.isActive) {
          hasAccess = true;
          if (userAccess.expiresAt === null) {
            isPermanent = true;
            accessBadgeText = 'Đã được cấp quyền';
          } else if (userAccess.expiresAt > now) {
            expiresAt = userAccess.expiresAt;
            remainingDays = Math.ceil(
              (userAccess.expiresAt.getTime() - now.getTime()) / 86400000,
            );
            accessBadgeText = `Đã cấp (${remainingDays} ngày)`;
          } else {
            hasAccess = false;
            accessBadgeText = 'Đã hết hạn';
          }
        }
      }

      return {
        id: sub.id,
        slug: sub.slug,
        title: sub.title,
        description: sub.description,
        isPaid: sub.isPaid,
        price: Number(sub.price),
        isPublished: sub.isPublished,
        orderIndex: sub.orderIndex,
        lessonCount,
        questionCount,
        hasAccess,
        isPermanent,
        expiresAt,
        remainingDays,
        accessBadgeText,
      };
    });
  }

  async findBySlug(slug: string, userId?: string, role?: Role) {
    const subject = await this.prisma.subject.findUnique({
      where: { slug },
      include: {
        lessons: {
          where: role === Role.ADMIN ? {} : { isActive: true },
          orderBy: { lessonNumber: 'asc' },
          include: {
            _count: {
              select: { questions: { where: { isActive: true } } },
            },
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Không tìm thấy môn học');
    }

    if (role !== Role.ADMIN) {
      if (!userId) {
        throw new ForbiddenException('Vui lòng đăng nhập để xem nội dung');
      }
      const hasAccess = await this.checkAccess(userId, subject.id, role);
      if (!hasAccess) {
        throw new ForbiddenException(
          'Bạn chưa được cấp quyền truy cập môn học này. Vui lòng liên hệ Quản trị viên để được cấp quyền.',
        );
      }
    }

    const now = new Date();
    let hasAccess = false;
    let isPermanent = false;
    let expiresAt: Date | null = null;
    let remainingDays: number | null = null;
    let accessBadgeText = 'Chưa được cấp quyền';

    if (role === Role.ADMIN) {
      hasAccess = true;
      isPermanent = true;
      accessBadgeText = 'Quản trị viên (Toàn quyền)';
    } else if (userId) {
      const access = await this.prisma.userSubjectAccess.findFirst({
        where: {
          userId,
          subjectId: subject.id,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      });

      if (access) {
        hasAccess = true;
        if (access.expiresAt === null) {
          isPermanent = true;
          accessBadgeText = 'Đã được cấp quyền';
        } else if (access.expiresAt > now) {
          expiresAt = access.expiresAt;
          remainingDays = Math.ceil(
            (access.expiresAt.getTime() - now.getTime()) / 86400000,
          );
          accessBadgeText = `Đã cấp (${remainingDays} ngày)`;
        }
      }
    }

    const lessons = subject.lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      lessonNumber: l.lessonNumber,
      title: l.title,
      description: l.description,
      isActive: l.isActive,
      questionCount: l._count.questions,
      status: l._count.questions > 0 ? 'available' : 'coming_soon',
    }));

    return {
      id: subject.id,
      slug: subject.slug,
      title: subject.title,
      description: subject.description,
      isPaid: subject.isPaid,
      price: Number(subject.price),
      isPublished: subject.isPublished,
      hasAccess,
      isPermanent,
      expiresAt,
      remainingDays,
      accessBadgeText,
      lessons,
    };
  }

  async checkAccess(userId: string, subjectId: string, role?: Role): Promise<boolean> {
    if (role === Role.ADMIN) return true;

    const now = new Date();
    const access = await this.prisma.userSubjectAccess.findFirst({
      where: {
        userId,
        subjectId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    return !!access;
  }
}
