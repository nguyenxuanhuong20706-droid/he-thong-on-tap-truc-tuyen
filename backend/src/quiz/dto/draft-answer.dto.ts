import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DraftAnswerDto {
  @IsString()
  @IsNotEmpty({ message: 'questionId không được để trống' })
  questionId: string;

  @IsArray({ message: 'selectedOptionIds phải là một danh sách' })
  @IsString({ each: true, message: 'Mỗi optionId phải là một chuỗi' })
  selectedOptionIds: string[];

  @IsNumber()
  @IsOptional()
  clientTimestamp?: number;
}

