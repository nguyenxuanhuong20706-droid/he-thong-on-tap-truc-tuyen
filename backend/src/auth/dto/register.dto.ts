import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
  @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
  @MaxLength(30, { message: 'Tên đăng nhập không được vượt quá 30 ký tự' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Tên đăng nhập chỉ chứa chữ cái, chữ số và dấu gạch dưới (_)',
  })
  username: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(100, { message: 'Mật khẩu không được vượt quá 100 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi ký tự' })
  confirmPassword: string;
}

