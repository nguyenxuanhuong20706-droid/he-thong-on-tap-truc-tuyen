import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitQuizDto {
  @IsString()
  @IsOptional()
  lessonId?: string;

  @IsString()
  @IsOptional()
  attemptId?: string;

  @IsNumber()
  @IsOptional()
  timeSpentSeconds?: number;

  @IsObject()
  @IsOptional()
  answers?: Record<string, string | string[]>; // questionId -> optionId(s) hoặc key
}
