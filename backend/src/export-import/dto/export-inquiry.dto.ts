import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator'

export class CreateExportInquiryDto {
  @ApiProperty({ example: 'b7f2c1a4-9d3e-4f8a-b2c1-5e6d7f8a9b0c', description: 'Browser session id (UUID stored in localStorage)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  sessionId: string

  @ApiProperty({ example: 'EXPORT', enum: ['EXPORT', 'IMPORT'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['EXPORT', 'IMPORT', 'export', 'import'])
  direction: string

  @ApiProperty({ example: 'farm', description: 'Category slug from the homepage tiles (farm, seeds, agri-machinery…)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  category: string

  @ApiProperty({ example: 'Basmati Rice' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  product: string

  @ApiPropertyOptional({ example: 'UAE', description: 'Destination/source country for international trade' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  country?: string

  @ApiPropertyOptional({ example: 'Punjab', description: 'Indian state — origin (export) or destination (import/domestic)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  state?: string

  @ApiPropertyOptional({ example: '500' })
  @IsOptional()
  @IsNumberString({}, { message: 'quantity must be a number' })
  quantity?: string

  @ApiPropertyOptional({ example: 'quintal', enum: ['kg', 'quintal', 'tonne', 'piece', 'litre'] })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  quantityUnit?: string

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, { message: 'mobile must be a valid 10-digit Indian number' })
  mobile?: string

  @ApiPropertyOptional({ example: 'Need export documentation help for Dubai shipment' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string
}

export class UpdateExportInquiryStatusDto {
  @ApiProperty({ example: 'CONTACTED', enum: ['PENDING', 'CONTACTED', 'GUIDED', 'CLOSED'] })
  @IsNotEmpty()
  @IsString()
  @Length(2, 32)
  contactStatus: string

  @ApiPropertyOptional({ example: 'Connected exporter with Dubai buyer' })
  @IsOptional()
  @IsString()
  notes?: string
}
