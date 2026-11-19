import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AdminCreateLicenseKeyDto {
  @IsArray({ message: 'Danh sách môn học phải là mảng' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 môn học' })
  @IsString({ each: true })
  subjectIds: string[];

  // durationDays: null or undefined for PERMANENT (vĩnh viễn), or number of days (e.g. 7, 30, 90, 365, custom)
  @IsOptional()
  @IsNumber({}, { message: 'Thời hạn phải là số ngày hợp lệ' })
  @Min(1, { message: 'Thời hạn tối thiểu là 1 ngày' })
  durationDays?: number | null;

  @IsOptional()
  @IsString()
  note?: string;
}

