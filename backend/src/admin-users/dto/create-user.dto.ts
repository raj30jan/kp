import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString, MinLength, MaxLength } from 'class-validator'

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'admin2@kisanpatrika.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  mobile?: string

  @ApiProperty({ example: 'StrongPass@123' })
  @IsString()
  @MinLength(8)
  password: string

  @ApiPropertyOptional({ example: 'Admin Two' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string

  @ApiPropertyOptional({ enum: ['user', 'agent', 'admin', 'super_admin'], default: 'user' })
  @IsOptional()
  @IsIn(['user', 'agent', 'admin', 'super_admin'])
  role?: string
}
