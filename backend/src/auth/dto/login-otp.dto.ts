import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator'

export class VerifyLoginOtpDto {
  @ApiProperty({ description: 'challengeId returned by POST /auth/login when otpRequired=true' })
  @IsNotEmpty()
  @IsString()
  @Length(16, 128)
  challengeId: string

  @ApiProperty({ example: '123456', description: '6-digit code emailed to the account' })
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, { message: 'OTP must be 6 digits' })
  otp: string
}

export class ResendLoginOtpDto {
  @ApiProperty({ description: 'challengeId returned by POST /auth/login' })
  @IsNotEmpty()
  @IsString()
  @Length(16, 128)
  challengeId: string
}
