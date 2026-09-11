import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator'

export class VerifyOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'mobile must be a valid 10-digit Indian number' })
  mobile: string

  @ApiProperty({ example: '123456', description: '6-digit OTP received via SMS or email' })
  @IsNotEmpty()
  @Length(6, 6)
  otp: string

  @ApiPropertyOptional({
    example: 'farmer@example.com',
    description: 'Email the OTP was also sent to (for logging/audit)',
  })
  @IsOptional()
  @IsEmail()
  email?: string
}
