import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.autoSeedIfEmpty();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async autoSeedIfEmpty() {
    try {
      const qCount = await this.question.count();
      if (qCount > 0) {
        this.logger.log(`Database already has ${qCount} questions. Skipping auto-seed.`);
        return;
      }

      this.logger.log('Database is empty. Starting automatic seed of 683 questions...');

      const possiblePaths = [
        path.join(__dirname, '..', '..', 'prisma', 'seed_data_683.json'),
        path.join(process.cwd(), 'prisma', 'seed_data_683.json'),
        path.join(process.cwd(), 'dist', 'prisma', 'seed_data_683.json'),
      ];

      let seedFilePath = '';
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          seedFilePath = p;
          break;
        }
      }

      if (!seedFilePath) {
        this.logger.warn('seed_data_683.json not found, skipping auto-seed.');
        return;
      }

      const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));

      // 1. Seed users
      for (const u of seedData.users) {
        await this.user.upsert({
          where: { username: u.username },
          update: {},
          create: {
            id: u.id,
            username: u.username,
            passwordHash: u.passwordHash,
            role: u.role,
            fullName: u.fullName,
            isActive: u.isActive,
          },
        });
      }

      // 2. Seed subjects, lessons, questions, options in transaction
      await this.$transaction(async (tx) => {
        for (const s of seedData.subjects) {
          const subject = await tx.subject.upsert({
            where: { slug: s.slug },
            update: {
              title: s.title,
              description: s.description,
              isPaid: s.isPaid,
              price: s.price,
              isPublished: s.isPublished,
              orderIndex: s.orderIndex,
            },
            create: {
              id: s.id,
              slug: s.slug,
              title: s.title,
              description: s.description,
              isPaid: s.isPaid,
              price: s.price,
              isPublished: s.isPublished,
              orderIndex: s.orderIndex,
            },
          });

          for (const l of s.lessons) {
            const lesson = await tx.lesson.upsert({
              where: {
                subjectId_slug: {
                  subjectId: subject.id,
                  slug: l.slug,
                },
              },
              update: {
                lessonNumber: l.lessonNumber,
                title: l.title,
                description: l.description,
                isActive: l.isActive,
              },
              create: {
                id: l.id,
                subjectId: subject.id,
                slug: l.slug,
                lessonNumber: l.lessonNumber,
                title: l.title,
                description: l.description,
                isActive: l.isActive,
              },
            });

            for (const q of l.questions) {
              await tx.question.create({
                data: {
                  id: q.id,
                  subjectId: subject.id,
                  lessonId: lesson.id,
                  questionNumber: q.questionNumber,
                  originalNumber: q.originalNumber,
                  displayNumber: q.displayNumber,
                  content: q.content,
                  questionType: q.questionType,
                  shuffleOptions: q.shuffleOptions,
                  explanation: q.explanation,
                  correctKey: q.correctKey,
                  metadata: q.metadata,
                  options: {
                    create: q.options.map((opt: any) => ({
                      id: opt.id,
                      key: opt.key,
                      displayKey: opt.displayKey,
                      text: opt.text,
                      isCorrect: opt.isCorrect,
                      orderIndex: opt.orderIndex,
                    })),
                  },
                },
              });
            }
          }
        }
      });

      this.logger.log('🎉 Auto-seed completed successfully! 683 questions loaded.');
    } catch (err: any) {
      this.logger.error('Failed to auto-seed database:', err.message);
    }
  }
}
