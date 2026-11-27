import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function main() {
  const filePath = path.join(__dirname, 'seed_data_683.json');
  const seedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log('1. Seeding users...');
  for (const u of seedData.users) {
    await prisma.user.upsert({
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

  console.log('2. Seeding subjects, lessons, and questions...');
  for (const s of seedData.subjects) {
    const subject = await prisma.subject.upsert({
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

    console.log(`- Subject: ${subject.title}`);

    for (const l of s.lessons) {
      const lesson = await prisma.lesson.upsert({
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
        const existingQ = await prisma.question.findUnique({
          where: { id: q.id }
        });
        if (!existingQ) {
          await prisma.question.create({
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
  }

  const qCount = await prisma.question.count();
  const subCount = await prisma.subject.count();
  const uCount = await prisma.user.count();
  console.log(`\n🎉 HOÀN TẤT THÀNH CÔNG RỰC RỠ!`);
  console.log(`- Số câu hỏi trên Neon DB: ${qCount}`);
  console.log(`- Số môn học: ${subCount}`);
  console.log(`- Số tài khoản: ${uCount}`);
}

main()
  .catch((e) => {
    console.error('Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
