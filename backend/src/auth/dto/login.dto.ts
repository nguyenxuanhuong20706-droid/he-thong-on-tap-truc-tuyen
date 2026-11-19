import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
  username: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  password: string;

  // Optional for Admin, required for User
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsString()
  challenge?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
