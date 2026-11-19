import { IsNotEmpty, IsString } from 'class-validator';

export class MfaVerifyDto {
  @IsNotEmpty({ message: 'Ticket xác thực không được để trống' })
  @IsString()
  mfaTicket: string;

  @IsNotEmpty({ message: 'Mã TOTP 6 số không được để trống' })
  @IsString()
  totpCode: string;
}

