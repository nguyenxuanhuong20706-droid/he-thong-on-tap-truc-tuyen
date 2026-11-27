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

  console.log('Fetching existing IDs from Neon DB...');
  const existingQuestions = await prisma.question.findMany({ select: { id: true } });
  const existingQSet = new Set(existingQuestions.map(q => q.id));

  const questionsToInsert: any[] = [];
  const optionsToInsert: any[] = [];

  for (const s of seedData.subjects) {
    const subject = await prisma.subject.upsert({
      where: { slug: s.slug },
      update: {},
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
      const lesson = await prisma.lesson.upsert({
        where: {
          subjectId_slug: {
            subjectId: subject.id,
            slug: l.slug,
          },
        },
        update: {},
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
        if (!existingQSet.has(q.id)) {
          questionsToInsert.push({
            id: q.id,
            subjectId: subject.id,
            lessonId: lesson.id,
            questionNumber: q.questionNumber,
            originalNumber: q.originalNumber,
            displayNumber: q.displayNumber,
            content: q.content,
            questionType: q.questionType,
            shuffleOptions: q.shuffleOptions,
            explanation: q.explanation || '',
            correctKey: q.correctKey,
            metadata: q.metadata,
          });

          for (const opt of q.options) {
            optionsToInsert.push({
              id: opt.id,
              questionId: q.id,
              key: opt.key,
              displayKey: opt.displayKey,
              text: opt.text,
              isCorrect: opt.isCorrect,
              orderIndex: opt.orderIndex,
            });
          }
        }
      }
    }
  }

  console.log(`Remaining questions to insert: ${questionsToInsert.length}`);
  console.log(`Remaining options to insert: ${optionsToInsert.length}`);

  if (questionsToInsert.length > 0) {
    // Batch insert questions in chunks of 100
    for (let i = 0; i < questionsToInsert.length; i += 100) {
      const chunk = questionsToInsert.slice(i, i + 100);
      await prisma.question.createMany({ data: chunk, skipDuplicates: true });
      console.log(`Inserted questions ${i + 1} - ${Math.min(i + 100, questionsToInsert.length)}`);
    }

    // Batch insert options in chunks of 300
    for (let i = 0; i < optionsToInsert.length; i += 300) {
      const chunk = optionsToInsert.slice(i, i + 300);
      await prisma.option.createMany({ data: chunk, skipDuplicates: true });
      console.log(`Inserted options ${i + 1} - ${Math.min(i + 300, optionsToInsert.length)}`);
    }
  }

  const finalQ = await prisma.question.count();
  const finalOpt = await prisma.option.count();
  console.log(`\n🎉 HOÀN TẤT TẤT CẢ! Tổng câu hỏi: ${finalQ}, Tổng đáp án: ${finalOpt}`);
}

main()
  .catch((e) => {
    console.error('Lỗi bulk seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
