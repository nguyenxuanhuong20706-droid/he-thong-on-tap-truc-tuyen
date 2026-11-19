import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CheckDeviceDto {
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

