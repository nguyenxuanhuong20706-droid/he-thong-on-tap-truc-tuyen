import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawLichSuDangQuestions = [
  {
    questionNumber: 1,
    question: 'Chức năng của môn học Lịch sử Đảng Cộng sản Việt Nam là:',
    options: [
      { key: 'A', text: 'Chức năng nhận thức, chức năng giáo dục, chức năng dự báo và phê phán', isCorrect: true },
      { key: 'B', text: 'Chức năng tổng kết, chức năng giáo dục', isCorrect: false },
      { key: 'C', text: 'Chức năng định hướng, chức năng biện luận, chức năng dự báo và phê phán', isCorrect: false },
      { key: 'D', text: 'Chức năng biện luận, chức năng dự báo và phê phán', isCorrect: false },
    ],
  },
  {
    questionNumber: 2,
    question: 'Đối tượng nghiên cứu của môn học Lịch sử Đảng Cộng sản Việt Nam là gì?',
    options: [
      { key: 'A', text: 'Chủ nghĩa Mác-Lênin', isCorrect: false },
      { key: 'B', text: 'Sự ra đời, phát triển và hoạt động lãnh đạo của Đảng qua các thời kỳ lịch sử', isCorrect: true },
      { key: 'C', text: 'Sự phát triển của các hình thái kinh tế xã hội', isCorrect: false },
      { key: 'D', text: 'Tư tưởng Hồ Chí Minh', isCorrect: false },
    ],
  },
  {
    questionNumber: 3,
    question: 'Đảng lãnh đạo cách mạng giải phóng dân tộc, xây dựng và phát triển đất nước bằng gì?',
    options: [
      { key: 'A', text: 'Cương lĩnh, đường lối, chủ trương, chính sách lớn của Đảng', isCorrect: true },
      { key: 'B', text: 'Cương lĩnh chính trị đầu tiên của Đảng', isCorrect: false },
      { key: 'C', text: 'Chính sách cụ thể đặt ra trong từng thời kỳ lịch sử', isCorrect: false },
      { key: 'D', text: 'Cương lĩnh xây dựng đất nước trong thời kỳ quá độ lên chủ nghĩa xã hội', isCorrect: false },
    ],
  },
  {
    questionNumber: 4,
    question: 'Quy luật ra đời và phát triển của Đảng Cộng sản Việt Nam là:',
    options: [
      { key: 'A', text: 'Chủ nghĩa Mác-Lênin và phong trào công nhân', isCorrect: false },
      { key: 'B', text: 'Chủ nghĩa Mác-Lênin và phong trào yêu nước', isCorrect: false },
      { key: 'C', text: 'Phong trào yêu nước kết hợp với tư tưởng Hồ Chí Minh', isCorrect: false },
      { key: 'D', text: 'Chủ nghĩa Mác-Lênin kết hợp với phong trào công nhân và phong trào yêu nước', isCorrect: true },
    ],
  },
  {
    questionNumber: 5,
    question: '“Làm rõ vai trò, sức chiến đấu của hệ thống tổ chức đảng từ Trung ương đến cơ sở trong lãnh đạo, tổ chức thực tiễn” là:',
    options: [
      { key: 'A', text: 'Một vai trò của khoa học Lịch sử Đảng Cộng sản Việt Nam', isCorrect: false },
      { key: 'B', text: 'Một nhiệm vụ của khoa học Lịch sử Đảng Cộng sản Việt Nam', isCorrect: true },
      { key: 'C', text: 'Một đối tượng của khoa học Lịch sử Đảng Cộng sản Việt Nam', isCorrect: false },
      { key: 'D', text: 'Một chức năng của khoa học Lịch sử Đảng Cộng sản Việt Nam', isCorrect: false },
    ],
  },
  {
    questionNumber: 6,
    question: 'Hội nghị thành lập Đảng năm 1930 do ai chủ trì?',
    options: [
      { key: 'A', text: 'Nguyễn Ái Quốc', isCorrect: true },
      { key: 'B', text: 'Trần Phú', isCorrect: false },
      { key: 'C', text: 'Nguyễn Đức Cảnh', isCorrect: false },
      { key: 'D', text: 'Trịnh Đình Cửu', isCorrect: false },
    ],
  },
  {
    questionNumber: 7,
    question: 'Ngày lễ kỷ niệm thành lập Đảng Cộng sản Việt Nam là ngày nào?',
    options: [
      { key: 'A', text: 'Ngày 6/1', isCorrect: false },
      { key: 'B', text: 'Ngày 3/2', isCorrect: true },
      { key: 'C', text: 'Ngày 6/2', isCorrect: false },
      { key: 'D', text: 'Ngày 24/2', isCorrect: false },
    ],
  },
  {
    questionNumber: 8,
    question: 'Phan Bội Châu là đại diện cho xu hướng nào trong phong trào đấu tranh theo khuynh hướng dân chủ tư sản ở Việt Nam đầu thế kỷ XX?',
    options: [
      { key: 'A', text: 'Xu hướng bạo động', isCorrect: true },
      { key: 'B', text: 'Xu hướng quốc gia cải lương', isCorrect: false },
      { key: 'C', text: 'Xu hướng cải cách', isCorrect: false },
      { key: 'D', text: 'Xu hướng đấu tranh bằng phương pháp hòa bình', isCorrect: false },
    ],
  },
  {
    questionNumber: 9,
    question: 'Cơ quan ngôn luận của Hội Việt Nam Cách mạng Thanh niên là:',
    options: [
      { key: 'A', text: 'Báo Lao động', isCorrect: false },
      { key: 'B', text: 'Báo Nhân đạo', isCorrect: false },
      { key: 'C', text: 'Báo Đời sống công nhân', isCorrect: false },
      { key: 'D', text: 'Báo Thanh niên', isCorrect: true },
    ],
  },
  {
    questionNumber: 10,
    question: 'Tổng Bí thư đầu tiên của Đảng Cộng sản Đông Dương là ai?',
    options: [
      { key: 'A', text: 'Lê Hồng Phong', isCorrect: false },
      { key: 'B', text: 'Hà Huy Tập', isCorrect: false },
      { key: 'C', text: 'Hồ Chí Minh', isCorrect: false },
      { key: 'D', text: 'Trần Phú', isCorrect: true },
    ],
  },
  {
    questionNumber: 11,
    question: 'Mâu thuẫn cơ bản và chủ yếu ở Việt Nam đầu thế kỷ XX là:',
    options: [
      { key: 'A', text: 'Mâu thuẫn giữa giai cấp công nhân với giai cấp tư sản', isCorrect: false },
      { key: 'B', text: 'Mâu thuẫn giữa công nhân và nông dân với đế quốc và phong kiến', isCorrect: false },
      { key: 'C', text: 'Mâu thuẫn giữa giai cấp nông dân với giai cấp địa chủ phong kiến', isCorrect: false },
      { key: 'D', text: 'Mâu thuẫn giữa dân tộc Việt Nam với đế quốc xâm lược và tay sai của chúng', isCorrect: true },
    ],
  },
  {
    questionNumber: 12,
    question: 'Trong giai đoạn hiện nay, vai trò của Đảng Cộng sản Việt Nam được xác định là:',
    options: [
      { key: 'A', text: 'Động lực cách mạng', isCorrect: false },
      { key: 'B', text: 'Vai trò nòng cốt', isCorrect: false },
      { key: 'C', text: 'Lãnh đạo cách mạng', isCorrect: true },
      { key: 'D', text: 'Vai trò định hướng cho cách mạng Việt Nam', isCorrect: false },
    ],
  },
  {
    questionNumber: 13,
    question: 'Đảng Cộng sản Việt Nam ra đời là kết quả của: (chọn đáp án đúng và đầy đủ nhất)',
    options: [
      { key: 'A', text: 'Các phong trào yêu nước của dân tộc phát triển mạnh mẽ', isCorrect: false },
      { key: 'B', text: 'Cuộc đấu tranh dân tộc và giai cấp quyết liệt của nhân dân Việt Nam', isCorrect: false },
      { key: 'C', text: 'Sự phát triển mạnh của phong trào yêu nước theo khuynh hướng vô sản', isCorrect: true },
      { key: 'D', text: 'Cuộc đấu tranh mạnh mẽ của giai cấp công nhân Việt Nam', isCorrect: false },
    ],
  },
  {
    questionNumber: 14,
    question: 'Nhân tố hàng đầu mang tính quyết định cho những thắng lợi về sau của cách mạng Việt Nam là:',
    options: [
      { key: 'A', text: 'Tinh thần đại đoàn kết của các tầng lớp nhân dân', isCorrect: false },
      { key: 'B', text: 'Sự phát triển mạnh mẽ của đất nước về kinh tế, chính trị', isCorrect: false },
      { key: 'C', text: 'Sự giúp đỡ của các lực lượng dân chủ thế giới', isCorrect: false },
      { key: 'D', text: 'Sự lãnh đạo đúng đắn của Đảng Cộng sản Việt Nam', isCorrect: true },
    ],
  },
  {
    questionNumber: 15,
    question: 'Nguyên nhân trực tiếp đặt ra yêu cầu thành lập chi bộ cộng sản đầu tiên của Việt Nam?',
    options: [
      { key: 'A', text: 'Do Bắc Kỳ tập trung nhiều trung tâm công nghiệp', isCorrect: false },
      { key: 'B', text: 'Do Bắc Kỳ là trung tâm cuộc khai thác thuộc địa lần thứ hai', isCorrect: false },
      { key: 'C', text: 'Do sự phát triển của phong trào cách mạng, trình độ giác ngộ của công nhân cao', isCorrect: true },
      { key: 'D', text: 'Do chủ nghĩa Mác-Lênin được truyền bá vào Việt Nam', isCorrect: false },
    ],
  },
  {
    questionNumber: 16,
    question: 'Nhiệm vụ của môn học Lịch sử Đảng Cộng sản Việt Nam là gì?',
    options: [
      { key: 'A', text: 'Tái hiện tiến trình lịch sử lãnh đạo, đấu tranh của Đảng, phân tích các vấn đề chính trị - xã hội', isCorrect: false },
      { key: 'B', text: 'Tổng kết lịch sử của Đảng, lãnh đạo cách mạng', isCorrect: false },
      { key: 'C', text: 'Trình bày có hệ thống đường lối, Cương lĩnh của Đảng, phân tích các vấn đề chính trị - xã hội', isCorrect: false },
      { key: 'D', text: 'Trình bày có hệ thống đường lối, Cương lĩnh của Đảng. Tái hiện, tổng kết tiến trình lịch sử lãnh đạo, đấu tranh của Đảng', isCorrect: true },
    ],
  },
  {
    questionNumber: 17,
    question: 'Phương pháp cơ bản để nghiên cứu môn học Lịch sử Đảng Cộng sản Việt Nam là gì?',
    options: [
      { key: 'A', text: 'Phương pháp tổng kết thực tiễn, phương pháp thống kê', isCorrect: false },
      { key: 'B', text: 'Phương pháp lịch sử, phương pháp phân tích', isCorrect: false },
      { key: 'C', text: 'Phương pháp so sánh, tổng hợp', isCorrect: false },
      { key: 'D', text: 'Phương pháp lịch sử, phương pháp logic', isCorrect: true },
    ],
  },
  {
    questionNumber: 18,
    question: 'Tháng 6/1925, từ lực lượng nòng cốt là nhóm Cộng sản Đoàn, Nguyễn Ái Quốc đã thành lập tổ chức nào?',
    options: [
      { key: 'A', text: 'Việt Nam Quốc dân Đảng', isCorrect: false },
      { key: 'B', text: 'Tâm tâm xã', isCorrect: false },
      { key: 'C', text: 'Tân Việt cách mạng Đảng', isCorrect: false },
      { key: 'D', text: 'Hội Việt Nam Cách mạng Thanh niên', isCorrect: true },
    ],
  },
  {
    questionNumber: 19,
    question: 'Cương lĩnh chính trị đầu tiên của Đảng Cộng sản Việt Nam đã kết hợp đúng đắn vấn đề:',
    options: [
      { key: 'A', text: 'Kinh tế và chính trị', isCorrect: false },
      { key: 'B', text: 'Phong kiến và tư sản', isCorrect: false },
      { key: 'C', text: 'Dân tộc và giai cấp', isCorrect: true },
      { key: 'D', text: 'Dân tộc và quân chủ', isCorrect: false },
    ],
  },
  {
    questionNumber: 20,
    question: 'Đâu không phải là luận điểm chứng minh việc thành lập Đảng Cộng sản Việt Nam là một bước ngoặt vĩ đại của lịch sử Việt Nam?',
    options: [
      { key: 'A', text: 'Đánh dấu khối liên minh công - nông đã được hình thành trong thực tế', isCorrect: true },
      { key: 'B', text: 'Là sự chuẩn bị tất yếu đầu tiên có tính quyết định cho những bước phát triển tiếp theo', isCorrect: false },
      { key: 'C', text: 'Chấm dứt cuộc khủng hoảng về đường lối cách mạng', isCorrect: false },
      { key: 'D', text: 'Đánh dấu phong trào công nhân hoàn toàn trở thành một phong trào tự giác', isCorrect: false },
    ],
  },
  {
    questionNumber: 21,
    question: 'Nội dung nào sau đây phản ánh không đúng ý nghĩa thành lập Đảng Cộng sản Việt Nam?',
    options: [
      { key: 'A', text: 'Là sự chuẩn bị tất yếu đầu tiên có tính chất quyết định cho những bước phát triển nhảy vọt mới trong lịch sử dân tộc Việt Nam', isCorrect: false },
      { key: 'B', text: 'Là một xu thế khách quan của cuộc vận động giải phóng dân tộc ở Việt Nam theo con đường cách mạng tư sản', isCorrect: true },
      { key: 'C', text: 'Là sản phẩm của sự kết hợp giữa chủ nghĩa Mác - Lênin với phong trào công nhân và phong trào yêu nước ở Việt Nam trong thời đại mới', isCorrect: false },
      { key: 'D', text: 'Là bước ngoặt vĩ đại trong lịch sử cách mạng Việt Nam, chấm dứt thời kỳ khủng hoảng, bế tắc về đường lối và giai cấp lãnh đạo cách mạng', isCorrect: false },
    ],
  },
];

async function main() {
  console.log('🚀 Bắt đầu gieo mầm dữ liệu (seed data)...');

  // 1. MÔN HỌC 1: Lịch sử Đảng (Miễn phí)
  const lichSuDang = await prisma.subject.upsert({
    where: { slug: 'lich-su-dang' },
    update: {
      title: 'Lịch sử Đảng Cộng sản Việt Nam',
      description: 'Hệ thống câu hỏi trắc nghiệm ôn tập toàn diện môn học Lịch sử Đảng Cộng sản Việt Nam',
      isPaid: false,
      price: 0,
      isPublished: true,
      orderIndex: 1,
    },
    create: {
      slug: 'lich-su-dang',
      title: 'Lịch sử Đảng Cộng sản Việt Nam',
      description: 'Hệ thống câu hỏi trắc nghiệm ôn tập toàn diện môn học Lịch sử Đảng Cộng sản Việt Nam',
      isPaid: false,
      price: 0,
      isPublished: true,
      orderIndex: 1,
    },
  });

  const lessonDefs = [
    { slug: 'bai-1', number: 1, title: 'Nhập môn Lịch sử Đảng Cộng sản Việt Nam' },
    { slug: 'bai-2', number: 2, title: 'Đảng lãnh đạo đấu tranh giành chính quyền (1930 - 1945)' },
    { slug: 'bai-3', number: 3, title: 'Đảng lãnh đạo hai cuộc kháng chiến hoàn thành giải phóng dân tộc (1945 - 1975)' },
    { slug: 'bai-4', number: 4, title: 'Đảng lãnh đạo cả nước quá độ lên CNXH và tiến hành công cuộc đổi mới (1975 đến nay)' },
    { slug: 'bai-5', number: 5, title: 'Tổng kết lịch sử và các bài học kinh nghiệm của Đảng Cộng sản Việt Nam' },
    { slug: 'bai-6', number: 6, title: 'Đảng lãnh đạo công cuộc đổi mới, hội nhập quốc tế toàn diện sâu rộng' },
  ];

  for (const l of lessonDefs) {
    const lesson = await prisma.lesson.upsert({
      where: {
        subjectId_slug: {
          subjectId: lichSuDang.id,
          slug: l.slug,
        },
      },
      update: {
        lessonNumber: l.number,
        title: l.title,
        isActive: true,
      },
      create: {
        subjectId: lichSuDang.id,
        slug: l.slug,
        lessonNumber: l.number,
        title: l.title,
        isActive: true,
      },
    });

    // Nếu là bài 1, seed 21 câu hỏi
    if (l.slug === 'bai-1') {
      const existingQCount = await prisma.question.count({
        where: { lessonId: lesson.id },
      });

      if (existingQCount === 0) {
        console.log(`📝 Đang nạp 21 câu hỏi Lịch sử Đảng vào Bài 1...`);
        for (const q of rawLichSuDangQuestions) {
          await prisma.question.create({
            data: {
              subjectId: lichSuDang.id,
              lessonId: lesson.id,
              questionNumber: q.questionNumber,
              content: q.question,
              options: {
                create: q.options.map((opt) => ({
                  key: opt.key,
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                })),
              },
            },
          });
        }
        console.log(`✅ Đã nạp thành công 21 câu hỏi vào Bài 1!`);
      }
    }
  }

  // 2. MÔN HỌC 2: Triết học Mác - Lênin (Trả phí - 50.000 VNĐ)
  const trietHoc = await prisma.subject.upsert({
    where: { slug: 'triet-hoc-mac-lenin' },
    update: {
      title: 'Triết học Mác - Lênin',
      description: 'Học thuyết Triết học Mác - Lênin, thế giới quan duy vật biện chứng và phương pháp luận',
      isPaid: true,
      price: 50000,
      isPublished: true,
      orderIndex: 2,
    },
    create: {
      slug: 'triet-hoc-mac-lenin',
      title: 'Triết học Mác - Lênin',
      description: 'Học thuyết Triết học Mác - Lênin, thế giới quan duy vật biện chứng và phương pháp luận',
      isPaid: true,
      price: 50000,
      isPublished: true,
      orderIndex: 2,
    },
  });

  const trietHocLesson1 = await prisma.lesson.upsert({
    where: {
      subjectId_slug: {
        subjectId: trietHoc.id,
        slug: 'bai-1',
      },
    },
    update: {
      lessonNumber: 1,
      title: 'Triết học và vấn đề cơ bản của Triết học',
      isActive: true,
    },
    create: {
      subjectId: trietHoc.id,
      slug: 'bai-1',
      lessonNumber: 1,
      title: 'Triết học và vấn đề cơ bản của Triết học',
      isActive: true,
    },
  });

  const existingTrietCount = await prisma.question.count({
    where: { lessonId: trietHocLesson1.id },
  });

  if (existingTrietCount === 0) {
    const sampleTrietQuestions = [
      {
        questionNumber: 1,
        question: 'Vấn đề cơ bản của triết học là gì?',
        options: [
          { key: 'A', text: 'Mối quan hệ giữa tư duy và tồn tại (giữa ý thức và vật chất)', isCorrect: true },
          { key: 'B', text: 'Mối quan hệ giữa con người và tự nhiên', isCorrect: false },
          { key: 'C', text: 'Quy luật phát triển của xã hội', isCorrect: false },
          { key: 'D', text: 'Mối quan hệ giữa lý luận và thực tiễn', isCorrect: false },
        ],
      },
      {
        questionNumber: 2,
        question: 'Chủ nghĩa duy vật biện chứng do ai sáng lập?',
        options: [
          { key: 'A', text: 'C.Mác và Ph.Ăngghen', isCorrect: true },
          { key: 'B', text: 'V.I.Lênin', isCorrect: false },
          { key: 'C', text: 'Hêghen và Phoiơbắc', isCorrect: false },
          { key: 'D', text: 'Arixtốt', isCorrect: false },
        ],
      },
      {
        questionNumber: 3,
        question: 'Thuộc tính cơ bản nhất của vật chất theo định nghĩa của Lênin là gì?',
        options: [
          { key: 'A', text: 'Vận động và đứng im tương đối', isCorrect: false },
          { key: 'B', text: 'Tồn tại khách quan độc lập với ý thức con người', isCorrect: true },
          { key: 'C', text: 'Có khối lượng và chiếm không gian', isCorrect: false },
          { key: 'D', text: 'Có cấu tạo từ các hạt nguyên tử', isCorrect: false },
        ],
      },
    ];

    for (const q of sampleTrietQuestions) {
      await prisma.question.create({
        data: {
          subjectId: trietHoc.id,
          lessonId: trietHocLesson1.id,
          questionNumber: q.questionNumber,
          content: q.question,
          options: {
            create: q.options.map((opt) => ({
              key: opt.key,
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          },
        },
      });
    }
  }

  // 3. MÔN HỌC 3: Kinh tế chính trị Mác - Lênin (Trả phí - 65.000 VNĐ)
  await prisma.subject.upsert({
    where: { slug: 'kinh-te-chinh-tri' },
    update: {
      title: 'Kinh tế chính trị Mác - Lênin',
      description: 'Hàng hóa, thị trường, giá trị thặng dư và quy luật kinh tế thị trường định hướng XHCN',
      isPaid: true,
      price: 65000,
      isPublished: true,
      orderIndex: 3,
    },
    create: {
      slug: 'kinh-te-chinh-tri',
      title: 'Kinh tế chính trị Mác - Lênin',
      description: 'Hàng hóa, thị trường, giá trị thặng dư và quy luật kinh tế thị trường định hướng XHCN',
      isPaid: true,
      price: 65000,
      isPublished: true,
      orderIndex: 3,
    },
  });

  console.log('🎉 Seed dữ liệu hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

