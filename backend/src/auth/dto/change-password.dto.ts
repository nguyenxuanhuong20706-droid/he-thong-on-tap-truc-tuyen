import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Xác nhận mật khẩu mới không được để trống' })
  confirmNewPassword: string;
}

