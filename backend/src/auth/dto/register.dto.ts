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

  @ApiPropertyOptional({ example: '110001', description: '6-digit Indian PIN code. Optional if address was auto-filled via GPS.' })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'pincode must be a 6-digit number' })
  pincode?: string

  @ApiProperty({ example: '1', description: 'Country ID from /location/countries' })
  @IsNotEmpty()
  @IsString()
  countryId: string

  @ApiPropertyOptional({ example: '12', description: 'State ID from /location/states?countryId=. Optional if address was auto-filled via GPS.' })
  @IsOptional()
  @IsString()
  stateId?: string

  @ApiPropertyOptional({ example: '56', description: 'District ID from /location/districts?stateId=. Optional if address was auto-filled via GPS.' })
  @IsOptional()
  @IsString()
  districtId?: string

  @ApiPropertyOptional({ example: '89', description: 'Tehsil (city) ID from /location/cities?districtId=. Optional if address was auto-filled via GPS.' })
  @IsOptional()
  @IsString()
  cityId?: string

  @ApiPropertyOptional({ example: 30.4278, description: 'GPS latitude captured by device' })
  @IsOptional()
  latitude?: number

  @ApiPropertyOptional({ example: 75.5487, description: 'GPS longitude captured by device' })
  @IsOptional()
  longitude?: number

  // ---------- Captcha (always required) ----------
  @ApiProperty({ example: 'a1b2c3d4e5f6g7h8', description: 'captchaId from GET /auth/captcha' })
  @IsNotEmpty()
  @IsString()
  captchaId: string

  @ApiProperty({ example: '12', description: 'Answer to the captcha question' })
  @IsNotEmpty()
  @IsString()
  captchaAnswer: string

  @ApiPropertyOptional({ example: true, description: 'User accepted the Terms & Conditions (mandatory checkbox on the register form)' })
  @IsOptional()
  acceptTerms?: boolean
}
