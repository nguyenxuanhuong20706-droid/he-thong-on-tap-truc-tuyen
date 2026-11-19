import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  key: string; // 'A' | 'B' | 'C' | 'D'

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class AdminCreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @IsNumber()
  questionNumber: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];
}

