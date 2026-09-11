import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

export class CreateServiceInterestDto {
  @ApiProperty({ example: 'b7f2c1a4-9d3e-4f8a-b2c1-5e6d7f8a9b0c', description: 'Browser session id (UUID stored in localStorage)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  sessionId: string

  @ApiProperty({ example: 'HIRE_MACHINERY', description: 'Stable service code, e.g. BUYERS, SELLERS, HIRE_MACHINERY' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  serviceCode: string

  @ApiProperty({ example: 'Hire Machinery — JCB, Tractor, Combine, Drone' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  serviceName: string

  @ApiPropertyOptional({ example: '9876543210', description: 'Mobile if the user is logged in / came from OTP flow' })
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, { message: 'mobile must be a valid 10-digit Indian number' })
  mobile?: string

  @ApiPropertyOptional({ example: 'home', description: 'Page where the service was selected' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sourcePage?: string
}

export class UpdateContactStatusDto {
  @ApiProperty({ example: 'CONTACTED', enum: ['PENDING', 'CONTACTED', 'GUIDED', 'CLOSED'] })
  @IsNotEmpty()
  @IsString()
  @Length(2, 32)
  contactStatus: string

  @ApiPropertyOptional({ example: 'Called farmer, explained how to list wheat crop' })
  @IsOptional()
  @IsString()
  notes?: string
}
