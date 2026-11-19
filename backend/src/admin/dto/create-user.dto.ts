import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminCreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Tên đăng nhập tối thiểu 3 ký tự' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;
}

