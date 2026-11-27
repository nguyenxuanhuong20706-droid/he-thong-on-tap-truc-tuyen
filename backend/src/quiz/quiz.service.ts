import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubjectsService } from '../subjects/subjects.service.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { StartQuizDto } from './dto/start-quiz.dto.js';
import { DraftAnswerDto } from './dto/draft-answer.dto.js';
import { Role, AttemptStatus } from '@prisma/client';
import { QuizRandomizer, RandomizeResult } from '../common/utils/quiz-randomizer.js';

interface SnapshotOption {
  id: string;
  key: string; // original key ('A', 'B'...)
  displayKey: string; // current displayed letter ('A', 'B'...)
  text: string;
}

interface SnapshotQuestion {
  id: string;
  displayNumber: number;
  originalNumber: number;
  content: string;
  questionType?: string;
  explanation?: string | null;
  shuffleOptions: boolean;
  metadata?: any;
  options: SnapshotOption[];
}

interface AttemptSnapshot {
  version: number;
  createdAt: string;
  totalAvailable: number;
  requestedCount: number | null;
  servedCount: number;
  isClamped: boolean;
  questions: SnapshotQuestion[];
}

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subjectsService: SubjectsService,
  ) {}

  // =========================================================================
  // 1. START HOẶC RESUME ATTEMPT (Quiz Randomization Engine)
  // =========================================================================
  async startOrResumeAttempt(dto: StartQuizDto, userId: string, role?: Role) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: { subject: true },
    });

    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học');
    }

    // Kiểm tra quyền truy cập môn học (RBAC)
    const hasAccess = await this.subjectsService.checkAccess(
      userId,
      lesson.subjectId,
      role,
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'Bạn chưa được cấp quyền làm bài cho môn học này. Vui lòng liên hệ Quản trị viên để được cấp quyền.',
      );
    }

    // 1. Nếu không yêu cầu forceNew: Kiểm tra xem có attempt IN_PROGRESS nào của user không
    if (!dto.forceNew) {
      const activeAttempt = await this.prisma.quizAttempt.findFirst({
        where: {
          userId,
          lessonId: lesson.id,
          status: AttemptStatus.IN_PROGRESS,
        },
      });

      if (activeAttempt && activeAttempt.snapshot) {
        const snapshot = activeAttempt.snapshot as unknown as AttemptSnapshot;
        return this.formatAttemptResponse(
          activeAttempt.id,
          lesson,
          snapshot,
          (activeAttempt.draftAnswers as Record<string, string[]>) || {},
          true,
          activeAttempt.completedAt,
        );
      }
    }

    // 2. Tạo attempt mới với đề xáo trộn (sử dụng transaction để chống race condition)
    return await this.prisma.$transaction(async (tx) => {
      // Đánh dấu các attempt IN_PROGRESS trước đó thành ABANDONED (nếu forceNew)
      await tx.quizAttempt.updateMany({
        where: {
          userId,
          lessonId: lesson.id,
          status: AttemptStatus.IN_PROGRESS,
        },
        data: {
          status: AttemptStatus.ABANDONED,
        },
      });

      // Lấy câu hỏi active của bài học (hỗ trợ lọc danh sách câu sai khi người dùng làm lại câu sai)
      const whereClause: any = {
        lessonId: lesson.id,
        isActive: true,
      };
      if (dto.questionIds && Array.isArray(dto.questionIds) && dto.questionIds.length > 0) {
        whereClause.id = { in: dto.questionIds };
      }

      const questions = await tx.question.findMany({
        where: whereClause,
        orderBy: { questionNumber: 'asc' },
        include: {
          options: {
            orderBy: { key: 'asc' },
          },
        },
      });

      if (questions.length === 0) {
        throw new BadRequestException('Bài học này chưa có câu hỏi nào để làm bài');
      }

      // Xáo trộn bằng QuizRandomizer Engine (Không hardcode bất kỳ ID hay slug nào)
      const randomized = QuizRandomizer.randomizeQuiz(
        questions,
        (q) => q.options,
        (q) => q.shuffleOptions,
        dto.questionCount,
      );

      // Xây dựng snapshot lưu trữ an toàn (KHÔNG LỘ isCorrect)
      const snapshot: AttemptSnapshot = {
        version: 1,
        createdAt: new Date().toISOString(),
        totalAvailable: randomized.metadata.totalAvailable,
        requestedCount: randomized.metadata.requestedCount,
        servedCount: randomized.metadata.servedCount,
        isClamped: randomized.metadata.isClamped,
        questions: randomized.questions.map((rq) => {
          const isTextType =
            rq.question.questionType === 'FILL_BLANKS' ||
            rq.question.questionType === 'MATCHING';
          return {
            id: rq.question.id,
            displayNumber: rq.displayNumber,
            originalNumber: rq.question.questionNumber,
            content: rq.question.content,
            questionType: rq.question.questionType || 'SINGLE_CHOICE',
            explanation: rq.question.explanation,
            shuffleOptions: rq.question.shuffleOptions,
            metadata: rq.question.metadata,
            options: isTextType
              ? []
              : rq.options.map((ro) => ({
                  id: ro.option.id,
                  key: ro.option.key,
                  displayKey: ro.displayKey,
                  text: ro.option.text,
                })),
          };
        }),
      };

      // Tạo attempt trong database với trạng thái IN_PROGRESS
      const newAttempt = await tx.quizAttempt.create({
        data: {
          userId,
          subjectId: lesson.subjectId,
          lessonId: lesson.id,
          status: AttemptStatus.IN_PROGRESS,
          totalQuestions: snapshot.questions.length,
          snapshot: snapshot as any,
          draftAnswers: {},
        },
      });

      return this.formatAttemptResponse(
        newAttempt.id,
        lesson,
        snapshot,
        {},
        false,
        newAttempt.completedAt,
      );
    });
  }

  // =========================================================================
  // 2. LẤY ATTEMPT ĐANG LÀM CỦA BÀI HỌC (Cho F5 / Resume)
  // =========================================================================
  async getActiveAttempt(lessonId: string, userId: string, role?: Role) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { subject: true },
    });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');

    const hasAccess = await this.subjectsService.checkAccess(
      userId,
      lesson.subjectId,
      role,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền truy cập bài học này');
    }

    const activeAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        userId,
        lessonId,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (!activeAttempt || !activeAttempt.snapshot) {
      return { hasActive: false };
    }

    const snapshot = activeAttempt.snapshot as unknown as AttemptSnapshot;
    return {
      hasActive: true,
      data: this.formatAttemptResponse(
        activeAttempt.id,
        lesson,
        snapshot,
        (activeAttempt.draftAnswers as Record<string, string[]>) || {},
        true,
        activeAttempt.completedAt,
      ),
    };
  }

  // =========================================================================
  // 3. AUTOSAVE DRAFT CÂU TRẢ LỜI
  // =========================================================================
  async saveDraftAnswer(attemptId: string, dto: DraftAnswerDto, userId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm bài');
    if (attempt.userId !== userId) {
      throw new ForbiddenException('Bạn không sở hữu lượt làm bài này');
    }
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Lượt làm bài đã hoàn thành hoặc không còn hiệu lực');
    }

    const snapshot = attempt.snapshot as unknown as AttemptSnapshot;
    if (!snapshot || !snapshot.questions.some((q) => q.id === dto.questionId)) {
      throw new BadRequestException('Câu hỏi không thuộc đề thi này');
    }

    const targetQuestion = snapshot.questions.find((q) => q.id === dto.questionId)!;
    if (
      targetQuestion.questionType !== 'FILL_BLANKS' &&
      targetQuestion.questionType !== 'MATCHING' &&
      targetQuestion.questionType !== 'TRUE_FALSE_GROUP'
    ) {
      const validOptionIds = new Set(targetQuestion.options.map((o) => o.id));
      for (const optId of dto.selectedOptionIds) {
        if (!validOptionIds.has(optId)) {
          throw new BadRequestException(`Option ID ${optId} không hợp lệ cho câu hỏi này`);
        }
      }
    }

    const currentDrafts = (attempt.draftAnswers as Record<string, string[]>) || {};
    const updatedDrafts = {
      ...currentDrafts,
      [dto.questionId]: dto.selectedOptionIds,
    };

    await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        draftAnswers: updatedDrafts,
      },
    });

    return {
      success: true,
      savedAt: new Date().toISOString(),
    };
  }

  // =========================================================================
  // 4. SUBMIT VÀ CHẤM ĐIỂM THEO OPTION ID GỐC (Chống submit trùng)
  // =========================================================================
  async submitAttempt(attemptId: string, dto: SubmitQuizDto, userId: string, role?: Role) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        lesson: { include: { subject: true } },
      },
    });

    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm bài');
    if (attempt.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền nộp lượt làm bài này');
    }

    // Idempotent: Nếu đã submit trước đó, trả lại kết quả cũ mà không tạo thêm record
    if (attempt.status === AttemptStatus.COMPLETED) {
      return this.getAttemptDetail(attempt.id, userId, role);
    }
    if (attempt.status === AttemptStatus.ABANDONED) {
      throw new BadRequestException('Lượt làm bài này đã bị hủy bỏ');
    }

    // Atomic Grading & State Update
    return await this.prisma.$transaction(async (tx) => {
      // Re-check status inside transaction to prevent concurrent duplicate submissions
      const current = await tx.quizAttempt.findUnique({ where: { id: attemptId } });
      if (!current || current.status === AttemptStatus.COMPLETED) {
        return this.getAttemptDetail(attemptId, userId, role);
      }

      const snapshot = current.snapshot as unknown as AttemptSnapshot;
      if (!snapshot) {
        throw new BadRequestException('Không tìm thấy dữ liệu đề thi của lượt làm bài');
      }

      // Merge answers: Client body ưu tiên hơn draftAnswers
      const clientAnswers = dto.answers || {};
      const draftAnswers = (current.draftAnswers as Record<string, string[]>) || {};

      // Chuẩn hóa cấu trúc câu trả lời: questionId -> string[] (danh sách optionIds)
      const normalizedAnswers: Record<string, string[]> = {};
      for (const q of snapshot.questions) {
        const clientVal = clientAnswers[q.id] ?? draftAnswers[q.id];
        if (clientVal !== undefined && clientVal !== null) {
          const valArray = Array.isArray(clientVal) ? clientVal : [clientVal];
          if (q.questionType === 'TRUE_FALSE_GROUP') {
            // Chuẩn hóa định dạng id:choice ('Đúng' hoặc 'Sai')
            const tfTokens: string[] = [];
            for (const val of valArray) {
              const strVal = String(val).trim();
              if (strVal.includes(',')) {
                for (const part of strVal.split(',')) {
                  if (part.trim()) tfTokens.push(part.trim());
                }
              } else if (strVal) {
                tfTokens.push(strVal);
              }
            }
            normalizedAnswers[q.id] = tfTokens;
          } else if (q.questionType !== 'FILL_BLANKS' && q.questionType !== 'MATCHING') {
            const resolvedOptionIds: string[] = [];
            for (const val of valArray) {
              const strVal = String(val).trim();
              const matchedOpt = q.options.find(
                (o) =>
                  o.id === strVal ||
                  (o.displayKey && o.displayKey.toUpperCase() === strVal.toUpperCase()) ||
                  (o.key && o.key.toUpperCase() === strVal.toUpperCase()),
              );
              if (matchedOpt) {
                resolvedOptionIds.push(matchedOpt.id);
              } else if (strVal.length > 20) {
                resolvedOptionIds.push(strVal);
              }
            }
            normalizedAnswers[q.id] = resolvedOptionIds;
          } else {
            normalizedAnswers[q.id] = valArray.map(String);
          }
        } else {
          normalizedAnswers[q.id] = [];
        }
      }

      // Lấy toàn bộ Option thật từ cơ sở dữ liệu để chấm điểm
      const questionIds = snapshot.questions.map((q) => q.id);
      const dbQuestions = await tx.question.findMany({
        where: { id: { in: questionIds } },
        include: { options: true },
      });
      const dbQuestionsMap = new Map(dbQuestions.map((q) => [q.id, q]));

      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      const answerRecords: Array<{
        questionId: string;
        questionType: string;
        selectedOptionId: string | null;
        selectedOptionIds: string[];
        selectedKey: string | null;
        textAnswer: string | null;
        isCorrect: boolean;
        correctKey: string;
        questionContent: string;
        explanation: string | null;
        displayNumber: number;
        metadata?: any;
        options: Array<{
          id: string;
          displayKey: string;
          key: string;
          text: string;
          isCorrect: boolean;
        }>;
      }> = [];

      for (const sq of snapshot.questions) {
        const realQ = dbQuestionsMap.get(sq.id);
        if (!realQ) continue;

        const rawClientVal = clientAnswers[sq.id] ?? draftAnswers[sq.id];

        // 1. Chấm điểm FILL_BLANKS (Nhập câu trả lời)
        if (realQ.questionType === 'FILL_BLANKS') {
          const userText = typeof rawClientVal === 'string'
            ? rawClientVal.trim()
            : Array.isArray(rawClientVal) && rawClientVal.length > 0
              ? String(rawClientVal[0]).trim()
              : '';
          const correctText = (realQ.options[0]?.text || '').trim();
          const acceptedAnswers: string[] = (realQ.metadata as any)?.acceptedAnswers || [correctText];
          const normalizeText = (s: string) => (s || '').normalize('NFC').toLowerCase().replace(/[’`]/g, "'").replace(/[.,?!]/g, '').replace(/\s+/g, ' ').trim();
          const isMatched = acceptedAnswers.some(
            (ans) => normalizeText(ans) === normalizeText(userText),
          );
          let isCorrect = false;
          if (!userText) {
            unansweredCount++;
          } else if (isMatched) {
            isCorrect = true;
            correctCount++;
          } else {
            wrongCount++;
          }

          answerRecords.push({
            questionId: sq.id,
            questionType: realQ.questionType,
            selectedOptionId: null,
            selectedOptionIds: userText ? [userText] : [],
            selectedKey: userText || null,
            textAnswer: userText || null,
            isCorrect,
            correctKey: correctText,
            questionContent: sq.content,
            explanation: realQ.explanation || `Đáp án đúng: ${correctText}`,
            displayNumber: sq.displayNumber,
            metadata: realQ.metadata,
            options: realQ.options.map((ro) => ({
              id: ro.id,
              displayKey: 'ANSWER',
              key: ro.key,
              text: ro.text,
              isCorrect: true,
            })),
          });
          continue;
        }

        // 2. Chấm điểm MATCHING (Sắp xếp từ / Kéo thả)
        if (realQ.questionType === 'MATCHING') {
          const userText = typeof rawClientVal === 'string'
            ? rawClientVal.trim()
            : Array.isArray(rawClientVal)
              ? rawClientVal.join(' ').trim()
              : '';
          const correctText = (realQ.options[0]?.text || '').trim();
          const normalizeStr = (s: string) => (s || '').normalize('NFC').toLowerCase().replace(/[’`]/g, "'").replace(/[.,?!]/g, '').replace(/\s+/g, ' ').trim();
          const isMatched = normalizeStr(userText) === normalizeStr(correctText);

          let isCorrect = false;
          if (!userText) {
            unansweredCount++;
          } else if (isMatched) {
            isCorrect = true;
            correctCount++;
          } else {
            wrongCount++;
          }

          answerRecords.push({
            questionId: sq.id,
            questionType: realQ.questionType,
            selectedOptionId: null,
            selectedOptionIds: userText ? [userText] : [],
            selectedKey: userText || null,
            textAnswer: userText || null,
            isCorrect,
            correctKey: correctText,
            questionContent: sq.content,
            explanation: realQ.explanation || `Đáp án đúng: ${correctText}`,
            displayNumber: sq.displayNumber,
            metadata: realQ.metadata,
            options: realQ.options.map((ro) => ({
              id: ro.id,
              displayKey: 'ANSWER',
              key: ro.key,
              text: ro.text,
              isCorrect: true,
            })),
          });
          continue;
        }

        // 3. Chấm điểm TRUE_FALSE_GROUP (Nhóm nhận định Đúng / Sai)
        if (realQ.questionType === 'TRUE_FALSE_GROUP') {
          const rawTokens = normalizedAnswers[sq.id] || [];
          const userChoicesMap = new Map<string, 'Đúng' | 'Sai'>();

          for (const token of rawTokens) {
            if (token.includes(':')) {
              const [optId, choice] = token.split(':');
              if (choice === 'Đúng' || choice === 'Sai') {
                userChoicesMap.set(optId.trim(), choice);
              }
            } else if (token.length > 20) {
              // Legacy format: optionId in array represents 'Đúng'
              userChoicesMap.set(token.trim(), 'Đúng');
            }
          }

          const isAnswered = userChoicesMap.size > 0;
          let allCorrect = true;

          for (const opt of realQ.options) {
            const expectedChoice = opt.isCorrect ? 'Đúng' : 'Sai';
            const userChoice = userChoicesMap.get(opt.id) || (isAnswered ? 'Sai' : undefined);
            if (userChoice !== expectedChoice) {
              allCorrect = false;
            }
          }

          let isCorrect = false;
          if (!isAnswered) {
            unansweredCount++;
          } else if (allCorrect) {
            isCorrect = true;
            correctCount++;
          } else {
            wrongCount++;
          }

          // Chuẩn hóa selectedOptionIds lưu dạng id:choice
          const savedOptionIds = realQ.options.map((opt) => {
            const choice = userChoicesMap.get(opt.id) || (isAnswered ? 'Sai' : 'Chưa chọn');
            return `${opt.id}:${choice}`;
          });

          const correctKeyDisplay = realQ.options
            .map((opt) => `${opt.key}: ${opt.isCorrect ? 'Đúng' : 'Sai'}`)
            .join(' | ');

          const selectedKeyDisplay = realQ.options
            .map((opt) => `${opt.key}: ${userChoicesMap.get(opt.id) || 'Chưa chọn'}`)
            .join(' | ');

          answerRecords.push({
            questionId: sq.id,
            questionType: realQ.questionType,
            selectedOptionId: null,
            selectedOptionIds: savedOptionIds,
            selectedKey: selectedKeyDisplay,
            textAnswer: null,
            isCorrect,
            correctKey: correctKeyDisplay,
            questionContent: sq.content,
            explanation: realQ.explanation || sq.explanation || null,
            displayNumber: sq.displayNumber,
            metadata: realQ.metadata,
            options: sq.options.map((so) => {
              const realOpt = realQ.options.find((ro) => ro.id === so.id);
              return {
                id: so.id,
                displayKey: so.displayKey,
                key: so.key,
                text: so.text,
                isCorrect: realOpt ? realOpt.isCorrect : false,
              };
            }),
          });
          continue;
        }

        // 4. Chấm điểm SINGLE_CHOICE và MULTIPLE_CHOICE
        const correctOptions = realQ.options.filter((o) => o.isCorrect);
        const correctOptionIds = new Set(correctOptions.map((o) => o.id));

        const userSelectedIds = normalizedAnswers[sq.id] || [];
        const isAnswered = userSelectedIds.length > 0;

        // Chấm điểm hỗ trợ cả Single-choice và Multi-choice:
        // Đúng khi và chỉ khi: Đã chọn đúng tất cả các phương án đúng và KHÔNG chọn phương án sai
        let isCorrect = false;
        if (!isAnswered) {
          unansweredCount++;
        } else {
          const allCorrectSelected = correctOptions.every((co) => userSelectedIds.includes(co.id));
          const noWrongSelected = userSelectedIds.every((uid) => correctOptionIds.has(uid));
          if (allCorrectSelected && noWrongSelected) {
            isCorrect = true;
            correctCount++;
          } else {
            wrongCount++;
          }
        }

        // Tạo review theo thứ tự snapshot hiển thị
        const displayCorrectKey = sq.options
          .filter((so) => correctOptionIds.has(so.id))
          .map((so) => so.displayKey)
          .join(', ');

        const displaySelectedKey = sq.options
          .filter((so) => userSelectedIds.includes(so.id))
          .map((so) => so.displayKey)
          .join(', ');

        answerRecords.push({
          questionId: sq.id,
          questionType: realQ.questionType,
          selectedOptionId: userSelectedIds[0] || null,
          selectedOptionIds: userSelectedIds,
          selectedKey: displaySelectedKey || null,
          textAnswer: null,
          isCorrect,
          correctKey: displayCorrectKey || 'N/A',
          questionContent: sq.content,
          explanation: realQ.explanation || sq.explanation || null,
          displayNumber: sq.displayNumber,
          metadata: realQ.metadata,
          options: sq.options.map((so) => ({
            id: so.id,
            displayKey: so.displayKey,
            key: so.key,
            text: so.text,
            isCorrect: correctOptionIds.has(so.id),
          })),
        });
      }

      const totalQuestions = snapshot.questions.length;
      const score = Number(((correctCount / totalQuestions) * 10).toFixed(2));
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      const timeSpent = dto.timeSpentSeconds || attempt.timeSpentSeconds || 0;

      // Cập nhật trạng thái COMPLETED cho Attempt
      const updatedAttempt = await tx.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: AttemptStatus.COMPLETED,
          score,
          correctCount,
          wrongCount,
          unansweredCount,
          totalQuestions,
          timeSpentSeconds: timeSpent,
          submittedAt: new Date(),
          completedAt: new Date(),
          answers: {
            create: answerRecords.map((ans) => ({
              questionId: ans.questionId,
              selectedOptionId: ans.selectedOptionId,
              selectedOptionIds: ans.selectedOptionIds,
              selectedKey: ans.selectedKey,
              textAnswer: ans.textAnswer,
              isCorrect: ans.isCorrect,
            })),
          },
        },
      });

      // Nếu đây là lượt làm lại câu sai: Gộp kết quả vào lượt làm bài chính thức (Single History)
      if (current.parentAttemptId) {
        const parent = await tx.quizAttempt.findUnique({
          where: { id: current.parentAttemptId },
          include: {
            answers: true,
            lesson: { include: { subject: true } },
          },
        });

        if (parent && parent.snapshot) {
          const parentSnapshot = parent.snapshot as unknown as AttemptSnapshot;
          const retryAnswerMap = new Map(answerRecords.map((a) => [a.questionId, a]));
          const parentAnswerMap = new Map(parent.answers.map((a) => [a.questionId, a]));

          let mergedCorrectCount = 0;
          for (const psq of parentSnapshot.questions) {
            if (retryAnswerMap.has(psq.id)) {
              if (retryAnswerMap.get(psq.id)!.isCorrect) {
                mergedCorrectCount++;
              }
            } else {
              const pAns = parentAnswerMap.get(psq.id);
              if (pAns && pAns.isCorrect) {
                mergedCorrectCount++;
              }
            }
          }

          const parentTotal = parentSnapshot.questions.length;
          const mergedWrongCount = parentTotal - mergedCorrectCount;
          const mergedScore = Number(((mergedCorrectCount / parentTotal) * 10).toFixed(2));
          const mergedPercentage = Math.round((mergedCorrectCount / parentTotal) * 100);

          // Cập nhật lượt làm bài chính thức trong Database (giữ vững quy chuẩn 1 lượt làm = 1 lịch sử duy nhất)
          await tx.quizAttempt.update({
            where: { id: parent.id },
            data: {
              hasRetriedWrong: true,
              score: mergedScore,
              correctCount: mergedCorrectCount,
              wrongCount: mergedWrongCount,
              unansweredCount: 0,
            },
          });

          // Lấy thông tin câu hỏi từ DB để hiển thị review chuẩn xác cho toàn bộ N câu
          const dbQuestions = await tx.question.findMany({
            where: { id: { in: parentSnapshot.questions.map((q) => q.id) } },
            include: { options: true },
          });
          const dbMap = new Map(dbQuestions.map((q) => [q.id, q]));

          const mergedReview = parentSnapshot.questions.map((psq) => {
            const realQ = dbMap.get(psq.id);
            const isRetried = retryAnswerMap.has(psq.id);
            const activeAns = isRetried ? retryAnswerMap.get(psq.id)! : parentAnswerMap.get(psq.id);

            const correctOptionIds = new Set(
              realQ?.options.filter((o) => o.isCorrect).map((o) => o.id) || [],
            );
            const correctDisplayKey = psq.options
              .filter((o) => correctOptionIds.has(o.id))
              .map((o) => o.displayKey)
              .join(', ');

            const userSelectedIds = isRetried
              ? (activeAns as any).selectedOptionIds || []
              : (activeAns as any)?.selectedOptionIds || [];

            const displaySelectedKey = psq.options
              .filter((o) => userSelectedIds.includes(o.id))
              .map((o) => o.displayKey)
              .join(', ');

            return {
              questionId: psq.id,
              displayNumber: psq.displayNumber,
              questionContent: psq.content,
              questionType: realQ?.questionType || psq.questionType || 'SINGLE_CHOICE',
              selectedKey: displaySelectedKey || (activeAns as any)?.selectedKey || null,
              selectedOptionIds: userSelectedIds,
              textAnswer: (activeAns as any)?.textAnswer || null,
              correctKey: correctDisplayKey || (activeAns as any)?.correctKey || 'N/A',
              isCorrect: activeAns ? (activeAns as any).isCorrect : false,
              explanation: realQ?.explanation || psq.explanation || null,
              metadata: realQ?.metadata || psq.metadata,
              options: psq.options.map((so) => ({
                id: so.id,
                displayKey: so.displayKey,
                key: so.key,
                text: so.text,
                isCorrect: correctOptionIds.has(so.id),
              })),
              isRetried,
            };
          });

          return {
            attemptId: parent.id,
            retryAttemptId: updatedAttempt.id,
            hasRetriedWrong: true,
            score: mergedScore,
            percentage: mergedPercentage,
            correctCount: mergedCorrectCount,
            wrongCount: mergedWrongCount,
            unansweredCount: 0,
            totalQuestions: parentTotal,
            timeSpentSeconds: (parent.timeSpentSeconds || 0) + timeSpent,
            completedAt: updatedAttempt.completedAt,
            review: mergedReview,
          };
        }
      }

      return {
        attemptId: updatedAttempt.id,
        hasRetriedWrong: false,
        score,
        percentage,
        correctCount,
        wrongCount,
        unansweredCount,
        totalQuestions,
        timeSpentSeconds: updatedAttempt.timeSpentSeconds,
        completedAt: updatedAttempt.completedAt,
        review: answerRecords.map((a) => ({
          questionId: a.questionId,
          displayNumber: a.displayNumber,
          questionContent: a.questionContent,
          questionType: a.questionType,
          selectedKey: a.selectedKey,
          correctKey: a.correctKey,
          textAnswer: a.textAnswer,
          isCorrect: a.isCorrect,
          explanation: a.explanation,
          metadata: a.metadata,
          options: a.options,
        })),
      };
    });
  }

  // =========================================================================
  // 4.1 KHỞI TẠO LƯỢT LÀM LẠI CÂU SAI (Tối đa 1 lần / lượt gốc, bảo vệ đa tầng)
  // =========================================================================
  async startRetryAttempt(parentAttemptId: string, userId: string, role?: Role) {
    const parent = await this.prisma.quizAttempt.findUnique({
      where: { id: parentAttemptId },
      include: {
        lesson: { include: { subject: true } },
        answers: true,
      },
    });

    if (!parent) throw new NotFoundException('Không tìm thấy lượt làm bài gốc');
    if (parent.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không sở hữu lượt làm bài này');
    }
    if (parent.status !== AttemptStatus.COMPLETED) {
      throw new BadRequestException('Lượt làm bài gốc chưa hoàn thành');
    }
    if (parent.parentAttemptId) {
      throw new BadRequestException('Không thể làm lại từ một lượt làm lại');
    }
    if (parent.hasRetriedWrong) {
      throw new BadRequestException('Lượt làm bài này đã sử dụng quyền làm lại câu sai');
    }

    // Idempotency: Nếu đã có một retry attempt IN_PROGRESS cho parent này, trả về lượt đang dở
    const activeRetry = await this.prisma.quizAttempt.findFirst({
      where: {
        parentAttemptId: parent.id,
        userId,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (activeRetry && activeRetry.snapshot) {
      return this.formatAttemptResponse(
        activeRetry.id,
        parent.lesson,
        activeRetry.snapshot as unknown as AttemptSnapshot,
        (activeRetry.draftAnswers as Record<string, string[]>) || {},
        true,
        activeRetry.completedAt,
        parent.id,
      );
    }

    // Trích xuất các câu sai hoặc chưa trả lời từ parent snapshot & answers
    const parentSnapshot = parent.snapshot as unknown as AttemptSnapshot;
    if (!parentSnapshot || !parentSnapshot.questions) {
      throw new BadRequestException('Không tìm thấy dữ liệu đề thi gốc');
    }

    const answerMap = new Map(parent.answers.map((a) => [a.questionId, a]));
    const failedQuestionIds = parentSnapshot.questions
      .filter((sq) => {
        const ans = answerMap.get(sq.id);
        return !ans || ans.isCorrect === false;
      })
      .map((sq) => sq.id);

    if (failedQuestionIds.length === 0) {
      throw new BadRequestException('Bạn đã làm đúng tất cả các câu hỏi, không có câu sai để làm lại');
    }

    // Lấy câu hỏi từ Database
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: failedQuestionIds },
        isActive: true,
      },
      include: {
        options: {
          orderBy: { key: 'asc' },
        },
      },
    });

    if (questions.length === 0) {
      throw new BadRequestException('Không tìm thấy câu hỏi hợp lệ để làm lại');
    }

    // Xáo trộn K câu sai và các phương án theo QuizRandomizer (Đánh số liên tục 1..K)
    const randomized = QuizRandomizer.randomizeQuiz(
      questions,
      (q) => q.options,
      (q) => q.shuffleOptions,
      questions.length,
    );

    const snapshot: AttemptSnapshot = {
      version: 1,
      createdAt: new Date().toISOString(),
      totalAvailable: randomized.metadata.totalAvailable,
      requestedCount: failedQuestionIds.length,
      servedCount: randomized.metadata.servedCount,
      isClamped: false,
      questions: randomized.questions.map((rq) => {
        const isTextType =
          rq.question.questionType === 'FILL_BLANKS' ||
          rq.question.questionType === 'MATCHING';
        return {
          id: rq.question.id,
          displayNumber: rq.displayNumber,
          originalNumber: rq.question.questionNumber,
          content: rq.question.content,
          questionType: rq.question.questionType || 'SINGLE_CHOICE',
          explanation: rq.question.explanation,
          shuffleOptions: rq.question.shuffleOptions,
          metadata: rq.question.metadata,
          options: isTextType
            ? []
            : rq.options.map((ro) => ({
                id: ro.option.id,
                key: ro.option.key,
                displayKey: ro.displayKey,
                text: ro.option.text,
              })),
        };
      }),
    };

    const retryAttempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        subjectId: parent.subjectId,
        lessonId: parent.lessonId,
        parentAttemptId: parent.id,
        status: AttemptStatus.IN_PROGRESS,
        totalQuestions: snapshot.questions.length,
        snapshot: snapshot as any,
        draftAnswers: {},
      },
    });

    return this.formatAttemptResponse(
      retryAttempt.id,
      parent.lesson,
      snapshot,
      {},
      false,
      retryAttempt.completedAt,
      parent.id,
    );
  }

  // =========================================================================
  // 5. LEGACY WRAPPERS & TƯƠNG THÍCH NGƯỢC (Đảm bảo 100% test cũ chạy tốt)
  // =========================================================================
  async submitQuiz(dto: SubmitQuizDto, userId: string, role?: Role) {
    if (dto.attemptId) {
      return this.submitAttempt(dto.attemptId, dto, userId, role);
    }

    if (!dto.lessonId) {
      throw new BadRequestException('Thiếu lessonId hoặc attemptId');
    }

    // Tương thích ngược: Tự động khởi tạo attempt và nộp bài ngay
    const startRes = await this.startOrResumeAttempt(
      { lessonId: dto.lessonId, forceNew: true },
      userId,
      role,
    );

    return this.submitAttempt(startRes.attemptId, dto, userId, role);
  }

  async getLessonQuiz(lessonId: string, userId: string, role?: Role) {
    const res = await this.startOrResumeAttempt(
      { lessonId, forceNew: false },
      userId,
      role,
    );
    return {
      lesson: res.lesson,
      subject: res.subject,
      attemptId: res.attemptId,
      totalQuestions: res.totalQuestions,
      questions: res.questions,
    };
  }

  async checkAnswer(
    lessonId: string,
    questionId: string,
    selectedKeyOrOptionId: string,
    userId: string,
    role?: Role,
  ) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');

    const hasAccess = await this.subjectsService.checkAccess(userId, lesson.subjectId, role);
    if (!hasAccess) throw new ForbiddenException('Bạn không có quyền truy cập');

    const question = await this.prisma.question.findFirst({
      where: { id: questionId, lessonId },
      include: { options: true },
    });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

    const correctOptions = question.options.filter((o) => o.isCorrect);

    // 1. Live Check cho FILL_BLANKS
    if (question.questionType === 'FILL_BLANKS') {
      const userText = (selectedKeyOrOptionId || '').trim();
      const correctText = (question.options[0]?.text || '').trim();
      const acceptedAnswers: string[] = (question.metadata as any)?.acceptedAnswers || [correctText];
      const normalizeText = (s: string) => (s || '').normalize('NFC').toLowerCase().replace(/[’`]/g, "'").replace(/[.,?!]/g, '').replace(/\s+/g, ' ').trim();
      const isMatched = acceptedAnswers.some(
        (ans) => normalizeText(ans) === normalizeText(userText),
      );
      return {
        questionId: question.id,
        selectedKey: userText,
        isCorrect: isMatched,
        correctKey: correctText,
        explanation: question.explanation || `Đáp án đúng: ${correctText}`,
      };
    }

    // 2. Live Check cho MATCHING (Kéo thả / Sắp xếp từ / Ghép cặp)
    if (question.questionType === 'MATCHING') {
      const userText = (selectedKeyOrOptionId || '').trim();
      const pairs = (question.metadata as any)?.pairs;
      let isMatched = false;
      let correctText = (question.options[0]?.text || '').trim();

      if (pairs && Array.isArray(pairs)) {
        // Kiểm tra ghép cặp khái niệm
        // userText có dạng pair_id:value|pair_id:value hoặc json hoặc chuỗi đối chiếu
        const normalizeStr = (s: string) =>
          (s || '').normalize('NFC').toLowerCase().replace(/[’`]/g, "'").replace(/[.,?!]/g, '').replace(/\s+/g, ' ').trim();
        isMatched = normalizeStr(userText) === normalizeStr(correctText);
      } else {
        // Sắp xếp từ thành câu (Anh văn 3)
        const normalizeStr = (s: string) =>
          (s || '').normalize('NFC').toLowerCase().replace(/[’`]/g, "'").replace(/[.,?!]/g, '').replace(/\s+/g, ' ').trim();
        isMatched = normalizeStr(userText) === normalizeStr(correctText);
      }

      return {
        questionId: question.id,
        selectedKey: userText,
        isCorrect: isMatched,
        correctKey: correctText,
        explanation: question.explanation || `Đáp án đúng: ${correctText}`,
      };
    }

    // 3. Live Check cho TRUE_FALSE_GROUP
    if (question.questionType === 'TRUE_FALSE_GROUP') {
      const rawTokens = selectedKeyOrOptionId.includes(',')
        ? selectedKeyOrOptionId.split(',').map((s) => s.trim()).filter(Boolean)
        : [selectedKeyOrOptionId].filter(Boolean);

      const userChoicesMap = new Map<string, 'Đúng' | 'Sai'>();
      for (const token of rawTokens) {
        if (token.includes(':')) {
          const [optId, choice] = token.split(':');
          if (choice === 'Đúng' || choice === 'Sai') {
            userChoicesMap.set(optId.trim(), choice);
          }
        } else if (token.length > 20) {
          userChoicesMap.set(token.trim(), 'Đúng');
        }
      }

      let allCorrect = true;
      for (const opt of question.options) {
        const expectedChoice = opt.isCorrect ? 'Đúng' : 'Sai';
        const userChoice = userChoicesMap.get(opt.id);
        if (userChoice !== expectedChoice) {
          allCorrect = false;
        }
      }

      return {
        questionId: question.id,
        questionType: 'TRUE_FALSE_GROUP',
        selectedKey: selectedKeyOrOptionId,
        selectedOptionIds: rawTokens,
        isCorrect: allCorrect,
        correctOptionIds: correctOptions.map((o) => o.id),
        correctKey: question.options.map((o) => `${o.key}: ${o.isCorrect ? 'Đúng' : 'Sai'}`).join(' | '),
        explanation: question.explanation,
        options: question.options.map((opt) => ({
          id: opt.id,
          key: opt.key,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      };
    }

    // 4. Live Check cho SINGLE_CHOICE và MULTIPLE_CHOICE
    const userSelectedIds = selectedKeyOrOptionId.includes(',')
      ? selectedKeyOrOptionId.split(',').map((s) => s.trim()).filter(Boolean)
      : [selectedKeyOrOptionId].filter(Boolean);

    const isMulti = question.questionType === 'MULTIPLE_CHOICE' || correctOptions.length > 1;
    let isCorrect = false;
    let matchedOption = null;

    if (isMulti) {
      const allCorrectSelected = correctOptions.every((co) => userSelectedIds.includes(co.id));
      const noWrongSelected = userSelectedIds.every((uid) => correctOptions.some((co) => co.id === uid));
      isCorrect = allCorrectSelected && noWrongSelected && userSelectedIds.length === correctOptions.length;
    } else {
      matchedOption = question.options.find(
        (o) => o.id === selectedKeyOrOptionId,
      );
      isCorrect = matchedOption
        ? Boolean(matchedOption.isCorrect)
        : correctOptions.some((o) => o.key === selectedKeyOrOptionId || o.id === selectedKeyOrOptionId);
    }

    return {
      questionId: question.id,
      selectedKey: selectedKeyOrOptionId,
      selectedOptionId: matchedOption?.id || selectedKeyOrOptionId,
      selectedOptionIds: userSelectedIds,
      isCorrect,
      correctOptionId: correctOptions[0]?.id || null,
      correctOptionIds: correctOptions.map((o) => o.id),
      correctKey: correctOptions.map((o) => o.key).join(', ') || null,
      explanation: question.explanation,
    };
  }

  // =========================================================================
  // 6. XEM CHI TIẾT & LỊCH SỬ BÀI LÀM
  // =========================================================================
  async getUserHistory(userId: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId,
        status: AttemptStatus.COMPLETED,
        parentAttemptId: null, // Quy tắc: 1 lượt làm chính thức = 1 lịch sử duy nhất (làm lại câu sai gộp vào lượt gốc)
      },
      orderBy: { completedAt: 'desc' },
      include: {
        subject: { select: { title: true, slug: true } },
        lesson: { select: { title: true, lessonNumber: true, slug: true } },
      },
    });

    return attempts.map((a) => ({
      id: a.id,
      subjectTitle: a.subject.title,
      subjectSlug: a.subject.slug,
      lessonTitle: a.lesson.title,
      lessonNumber: a.lesson.lessonNumber,
      score: a.score,
      correctCount: a.correctCount,
      wrongCount: a.wrongCount,
      unansweredCount: a.unansweredCount,
      totalQuestions: a.totalQuestions,
      timeSpentSeconds: a.timeSpentSeconds,
      completedAt: a.completedAt,
      hasRetriedWrong: a.hasRetriedWrong,
    }));
  }

  async getAttemptDetail(attemptId: string, userId: string, role?: Role): Promise<any> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        subject: { select: { title: true, slug: true } },
        lesson: { select: { title: true, lessonNumber: true, slug: true } },
        answers: true,
        childAttempts: {
          where: { status: AttemptStatus.COMPLETED },
          include: {
            answers: true,
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Không tìm thấy bài làm');
    if (attempt.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xem bài làm này');
    }

    // Nếu người dùng yêu cầu xem lượt làm lại câu sai, tự động trỏ về lượt làm chính thức
    if (attempt.parentAttemptId) {
      return this.getAttemptDetail(attempt.parentAttemptId, userId, role);
    }

    // Nếu attempt có lưu snapshot, dùng snapshot để hiển thị đúng đề đã làm
    if (attempt.snapshot) {
      const snapshot = attempt.snapshot as unknown as AttemptSnapshot;
      const answersMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

      // Ưu tiên đè câu trả lời đã làm lại (retried answers)
      if (attempt.childAttempts && attempt.childAttempts.length > 0) {
        for (const child of attempt.childAttempts) {
          for (const ca of child.answers) {
            answersMap.set(ca.questionId, ca);
          }
        }
      }

      // Lấy toàn bộ Question và Options từ Database
      const dbQuestions = await this.prisma.question.findMany({
        where: { id: { in: snapshot.questions.map((q) => q.id) } },
        include: { options: true },
      });
      const dbMap = new Map(dbQuestions.map((q) => [q.id, q]));

      const reviewItems = snapshot.questions.map((sq) => {
        const ans = answersMap.get(sq.id);
        const realQ = dbMap.get(sq.id);

        const correctOptionIds = new Set(
          realQ?.options.filter((o) => o.isCorrect).map((o) => o.id) || [],
        );

        const correctDisplayKey = sq.options
          .filter((o) => correctOptionIds.has(o.id))
          .map((o) => o.displayKey)
          .join(', ');

        const userSelectedIds = ans?.selectedOptionIds || [];
        const displaySelectedKey = sq.options
          .filter((o) => userSelectedIds.includes(o.id))
          .map((o) => o.displayKey)
          .join(', ');

        return {
          questionId: sq.id,
          displayNumber: sq.displayNumber,
          questionContent: sq.content,
          questionType: realQ?.questionType || sq.questionType || 'SINGLE_CHOICE',
          selectedKey: displaySelectedKey || ans?.selectedKey || null,
          selectedOptionIds: userSelectedIds,
          textAnswer: ans?.textAnswer || null,
          correctKey: correctDisplayKey || 'N/A',
          isCorrect: ans?.isCorrect || false,
          explanation: sq.explanation || realQ?.explanation || null,
          metadata: realQ?.metadata || sq.metadata,
          options: sq.options.map((so) => ({
            id: so.id,
            displayKey: so.displayKey,
            key: so.key,
            text: so.text,
            isCorrect: correctOptionIds.has(so.id),
          })),
        };
      });

      return {
        id: attempt.id,
        subjectTitle: attempt.subject.title,
        lessonTitle: attempt.lesson.title,
        score: attempt.score,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        unansweredCount: attempt.unansweredCount,
        totalQuestions: attempt.totalQuestions,
        timeSpentSeconds: attempt.timeSpentSeconds,
        completedAt: attempt.completedAt,
        hasRetriedWrong: attempt.hasRetriedWrong,
        review: reviewItems,
        answers: reviewItems,
      };
    }

    // Fallback cho attempt cũ trước khi có snapshot
    return {
      id: attempt.id,
      subjectTitle: attempt.subject.title,
      lessonTitle: attempt.lesson.title,
      score: attempt.score,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unansweredCount: attempt.unansweredCount,
      totalQuestions: attempt.totalQuestions,
      timeSpentSeconds: attempt.timeSpentSeconds,
      completedAt: attempt.completedAt,
      hasRetriedWrong: attempt.hasRetriedWrong,
      review: attempt.answers.map((ans, idx) => {
        const correctOption = (ans as any).question?.options?.find((o: any) => o.isCorrect);
        return {
          questionId: ans.questionId,
          displayNumber: idx + 1,
          questionContent: (ans as any).question?.content || '',
          selectedKey: ans.selectedKey,
          correctKey: correctOption ? correctOption.key : null,
          isCorrect: ans.isCorrect,
          explanation: (ans as any).question?.explanation || null,
          options: (ans as any).question?.options?.map((o: any) => ({
            id: o.id,
            displayKey: o.key,
            key: o.key,
            text: o.text,
            isCorrect: o.isCorrect,
          })) || [],
        };
      }),
      answers: [],
    };
  }

  async clearUserHistory(userId: string) {
    await this.prisma.quizAnswer.deleteMany({
      where: { attempt: { userId } },
    });
    const result = await this.prisma.quizAttempt.deleteMany({
      where: { userId },
    });
    return {
      message: 'Đã xóa toàn bộ lịch sử làm bài thành công',
      deletedCount: result.count,
    };
  }

  // =========================================================================
  // HELPER: Format Response cho Client
  // =========================================================================
  private formatAttemptResponse(
    attemptId: string,
    lesson: any,
    snapshot: AttemptSnapshot,
    draftAnswers: Record<string, string[]>,
    resumed: boolean,
    startTime: Date,
    parentAttemptId?: string | null,
  ) {
    return {
      attemptId,
      parentAttemptId: parentAttemptId || null,
      resumed,
      startTime: (startTime || new Date()).toISOString(),
      lesson: {
        id: lesson.id,
        slug: lesson.slug,
        lessonNumber: lesson.lessonNumber,
        title: lesson.title,
        description: lesson.description,
      },
      subject: {
        id: lesson.subject.id,
        slug: lesson.subject.slug,
        title: lesson.subject.title,
        isPaid: lesson.subject.isPaid,
      },
      metadata: {
        totalAvailable: snapshot.totalAvailable,
        requestedCount: snapshot.requestedCount,
        servedCount: snapshot.servedCount,
        isClamped: snapshot.isClamped,
      },
      draftAnswers,
      totalQuestions: snapshot.questions.length,
      questions: snapshot.questions.map((q) => {
        const clientMetadata: Record<string, any> = { ...(q.metadata || {}) };
        delete clientMetadata.acceptedAnswers;
        delete clientMetadata.tokensOriginal;
        delete clientMetadata.isPatched;
        delete clientMetadata.correctAnswer;

        if (clientMetadata.statements && Array.isArray(clientMetadata.statements)) {
          clientMetadata.statements = clientMetadata.statements.map((s: any) => ({
            id: s.id,
            index: s.index,
            text: s.text,
          }));
        }

        return {
          id: q.id,
          displayNumber: q.displayNumber,
          questionNumber: q.originalNumber || q.displayNumber,
          content: q.content,
          questionType: q.questionType || 'SINGLE_CHOICE',
          metadata: clientMetadata,
          options: q.options.map((o) => ({
            id: o.id,
            key: o.key,
            displayKey: o.displayKey,
            text: o.text,
          })),
        };
      }),
    };
  }
}
