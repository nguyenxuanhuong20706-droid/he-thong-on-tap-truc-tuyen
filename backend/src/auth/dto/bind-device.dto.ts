import { IsNotEmpty, IsString } from 'class-validator';

export class BindDeviceDto {
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  password: string;

  @IsNotEmpty({ message: 'Mã kích hoạt không được để trống' })
  @IsString()
  activationCode: string;

  @IsNotEmpty({ message: 'Mã định danh thiết bị không được để trống' })
  @IsString()
  deviceId: string;

  @IsNotEmpty({ message: 'Tên thiết bị không được để trống' })
  @IsString()
  deviceName: string;

  @IsNotEmpty({ message: 'Khóa công khai thiết bị không được để trống' })
  @IsString()
  publicKey: string;

  @IsNotEmpty({ message: 'Chuỗi challenge không được để trống' })
  @IsString()
  challenge: string;

  @IsNotEmpty({ message: 'Chữ ký số thiết bị không được để trống' })
  @IsString()
  signature: string;
}

