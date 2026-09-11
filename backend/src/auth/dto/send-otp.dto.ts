import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator'

export class SendOtpDto {
  @ApiProperty({ example: '9876543210', description: '10-digit Indian mobile number' })
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'mobile must be a valid 10-digit Indian number' })
  mobile: string

  @ApiPropertyOptional({
    example: 'farmer@example.com',
    description: 'If provided, the same OTP is also sent to this email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string
}
