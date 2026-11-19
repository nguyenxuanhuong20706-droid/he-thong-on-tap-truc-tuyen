import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service.js';
import { QuizController } from './quiz.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SubjectsModule } from '../subjects/subjects.module.js';

@Module({
  imports: [PrismaModule, SubjectsModule],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}

