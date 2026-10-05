import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class ForgotPasswordDto {
  @ApiProperty({ example: 'farmer@example.com' })
  @IsEmail()
  @MaxLength(128)
  email: string
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'd0e9f6c1...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  token: string

  @ApiProperty({ example: 'NewPass123' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string
}
