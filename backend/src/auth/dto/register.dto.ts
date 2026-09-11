import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'Rajinder Singh' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  name: string

  @ApiProperty({ example: 'rajinder@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string

  @ApiProperty({ example: '9876543210', description: 'Must be OTP-verified before register' })
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'mobile must be a valid 10-digit Indian number' })
  mobile: string

  @ApiProperty({ example: 'StrongPass@123', minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  password: string

  // ---------- Location / address ----------
  @ApiProperty({ example: 'Village Rampur, Tehsil Fatehabad' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  addressLine1: string

  @ApiPropertyOptional({ example: 'Near Gurudwara' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string

  @ApiPropertyOptional({ example: 30.4278, description: 'GPS latitude captured by device' })
  @IsOptional()
  latitude?: number

  @ApiPropertyOptional({ example: 75.5487, description: 'GPS longitude captured by device' })
  @IsOptional()
  longitude?: number

  // ---------- Captcha (required only when OTP_REQUIRED=true) ----------
  @ApiPropertyOptional({ example: 'a1b2c3d4e5f6g7h8', description: 'captchaId from GET /auth/captcha' })
  @IsOptional()
  @IsString()
  captchaId?: string

  @ApiPropertyOptional({ example: '12', description: 'Answer to the captcha question' })
  @IsOptional()
  @IsString()
  captchaAnswer?: string
}
