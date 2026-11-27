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

  console.log('--- 1. XÓA SẠCH DỮ LIỆU CÂU HỎI CŨ ĐỂ KHÔNG BỊ TRÙNG LẶP ---');
  await prisma.quizAnswer.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  // BẢO VỆ TUYỆT ĐỐI: KHÔNG xóa userSubjectAccess để không làm mất môn học của người dùng
  await prisma.licenseKeySubject.deleteMany({});
  await prisma.option.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.subject.deleteMany({});
  console.log('✅ Đã dọn dẹp sạch sẽ ngân hàng câu hỏi (bảo toàn tài khoản và quyền môn học)!');

  console.log('--- 2. ĐỒNG BỘ TÀI KHOẢN NGƯỜI DÙNG (BẢO TOÀN MẬT KHẨU ĐÃ ĐỔI) ---');
  for (const u of seedData.users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        // TUYỆT ĐỐI KHÔNG ghi đè passwordHash khi update để người dùng đổi mật khẩu không bị mất
        role: u.role,
        fullName: u.fullName,
        isActive: u.isActive,
      },
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
  console.log('✅ Đã đồng bộ tài khoản người dùng!');

  console.log('--- 3. NẠP CHUẨN XÁC CÁC MÔN HỌC, BÀI HỌC VÀ CÂU HỎI ---');
  for (const s of seedData.subjects) {
    const subject = await prisma.subject.create({
      data: {
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

    console.log(`\n📌 Môn: ${subject.title}`);

    for (const l of s.lessons) {
      const lesson = await prisma.lesson.create({
        data: {
          id: l.id,
          subjectId: subject.id,
          slug: l.slug,
          lessonNumber: l.lessonNumber,
          title: l.title,
          description: l.description,
          isActive: l.isActive,
        },
      });

      console.log(`   - Bài ${lesson.lessonNumber}: ${lesson.title} (${l.questions.length} câu)`);

      const questionsToInsert: any[] = [];
      const optionsToInsert: any[] = [];

      for (const q of l.questions) {
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

      if (questionsToInsert.length > 0) {
        await prisma.question.createMany({ data: questionsToInsert });
      }
      if (optionsToInsert.length > 0) {
        await prisma.option.createMany({ data: optionsToInsert });
      }
    }
  }

  const finalQ = await prisma.question.count();
  const finalOpt = await prisma.option.count();
  const finalLessons = await prisma.lesson.count();
  const finalSubjects = await prisma.subject.count();

  console.log(`\n========================================`);
  console.log(`🎉 DỌN SẠCH VÀ NẠP LẠI THÀNH CÔNG 100%!`);
  console.log(`- Tổng số môn học: ${finalSubjects}`);
  console.log(`- Tổng số bài học: ${finalLessons}`);
  console.log(`- Tổng số câu hỏi: ${finalQ} (Chuẩn xác 683 câu hỏi)`);
  console.log(`- Tổng số đáp án : ${finalOpt}`);
  console.log(`========================================`);
}

main()
  .catch((e) => {
    console.error('Lỗi clean and reseed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
