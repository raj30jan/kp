import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class ContactDto {
  @ApiProperty({ example: 'Rajinder Singh' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  name: string

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'mobile must be a valid 10-digit Indian number' })
  mobile: string

  @ApiPropertyOptional({ example: 'rajinder@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiProperty({ example: 'I want to list my tractor for hire...' })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string

  @ApiProperty({ example: 'a1b2c3d4e5f6g7h8', description: 'captchaId from GET /auth/captcha' })
  @IsNotEmpty()
  @IsString()
  captchaId: string

  @ApiProperty({ example: '12', description: 'Answer to the captcha question' })
  @IsNotEmpty()
  @IsString()
  captchaAnswer: string
}
