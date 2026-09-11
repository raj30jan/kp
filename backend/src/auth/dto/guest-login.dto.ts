import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, Length, Matches } from 'class-validator'

/**
 * Guest access: mobile + OTP only. No password, no email.
 * Returns a short-lived JWT with role=guest.
 */
export class GuestLoginDto {
  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'mobile must be a valid 10-digit Indian number' })
  mobile: string

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @Length(6, 6)
  otp: string
}
