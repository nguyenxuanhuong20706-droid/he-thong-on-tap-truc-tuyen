import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuizService } from './quiz.service.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { StartQuizDto } from './dto/start-quiz.dto.js';
import { DraftAnswerDto } from './dto/draft-answer.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // 1. Khởi tạo hoặc tiếp tục lượt làm bài (Randomization Engine)
  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startQuiz(@Body() dto: StartQuizDto, @Req() req: any) {
    return this.quizService.startOrResumeAttempt(dto, req.user.id, req.user.role);
  }

  // 2. Lấy lượt làm bài đang dở của bài học (nếu có)
  @Get('attempt/active/:lessonId')
  async getActiveAttempt(@Param('lessonId') lessonId: string, @Req() req: any) {
    return this.quizService.getActiveAttempt(lessonId, req.user.id, req.user.role);
  }

  // 3. Tự động lưu câu trả lời tạm thời (Autosave Draft)
  @Patch('attempt/:id/draft')
  @HttpCode(HttpStatus.OK)
  async saveDraftAnswer(
    @Param('id') attemptId: string,
    @Body() dto: DraftAnswerDto,
    @Req() req: any,
  ) {
    return this.quizService.saveDraftAnswer(attemptId, dto, req.user.id);
  }

  // 4. Nộp bài theo attemptId (Chấm điểm an toàn theo Option ID gốc)
  @Post('attempt/:id/submit')
  @HttpCode(HttpStatus.OK)
  async submitAttempt(
    @Param('id') attemptId: string,
    @Body() dto: SubmitQuizDto,
    @Req() req: any,
  ) {
    return this.quizService.submitAttempt(attemptId, dto, req.user.id, req.user.role);
  }

  // 4.1 Làm lại câu sai (Tối đa 1 lần/lượt làm chính thức, kế thừa và gộp vào lượt gốc)
  @Post('attempt/:id/retry')
  @HttpCode(HttpStatus.OK)
  async startRetryAttempt(@Param('id') attemptId: string, @Req() req: any) {
    return this.quizService.startRetryAttempt(attemptId, req.user.id, req.user.role);
  }

  // =========================================================================
  // LEGACY ENDPOINTS (Tương thích 100% với các test cũ và frontend cũ)
  // =========================================================================
  @Get('lesson/:lessonId')
  async getLessonQuiz(@Param('lessonId') lessonId: string, @Req() req: any) {
    return this.quizService.getLessonQuiz(
      lessonId,
      req.user.id,
      req.user.role,
    );
  }

  @Post('check-answer')
  @HttpCode(HttpStatus.OK)
  async checkAnswer(
    @Body()
    body: {
      lessonId: string;
      questionId: string;
      selectedKey: string;
    },
    @Req() req: any,
  ) {
    return this.quizService.checkAnswer(
      body.lessonId,
      body.questionId,
      body.selectedKey,
      req.user.id,
      req.user.role,
    );
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitQuiz(@Body() dto: SubmitQuizDto, @Req() req: any) {
    return this.quizService.submitQuiz(dto, req.user.id, req.user.role);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.quizService.getUserHistory(req.user.id);
  }

  @Delete('history')
  async clearHistory(@Req() req: any) {
    return this.quizService.clearUserHistory(req.user.id);
  }

  @Get('attempt/:id')
  async getAttemptDetail(@Param('id') id: string, @Req() req: any) {
    return this.quizService.getAttemptDetail(id, req.user.id, req.user.role);
  }
}
