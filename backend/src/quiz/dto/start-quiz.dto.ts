import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class StartQuizDto {
  @IsString()
  @IsNotEmpty({ message: 'lessonId không được để trống' })
  lessonId: string;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'questionCount phải là số nguyên dương' })
  questionCount?: number;

  @IsBoolean()
  @IsOptional()
  forceNew?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  questionIds?: string[];
}

