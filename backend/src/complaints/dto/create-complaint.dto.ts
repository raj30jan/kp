import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateComplaintDto {
  @ApiProperty({ example: 'fraud', description: 'Complaint category', enum: ['legal', 'terms', 'policy', 'fraud', 'other'] })
  @IsIn(['legal', 'terms', 'policy', 'fraud', 'other'])
  category: string

  @ApiProperty({ example: 'Seller delivered spoiled produce' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  subject: string

  @ApiProperty({ example: 'Full description of the issue...' })
  @IsString()
  @MinLength(10)
  description: string

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  contactMobile?: string

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string
}
