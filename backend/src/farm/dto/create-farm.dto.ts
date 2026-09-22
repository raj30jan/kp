import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateFarmDto {
  @ApiProperty({ example: 'Farm Plot A' })
  @IsString()
  @MaxLength(128)
  name: string

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  area?: number

  @ApiPropertyOptional({ example: 'acres' })
  @IsOptional()
  @IsString()
  areaUnit?: string

  @ApiPropertyOptional({ example: 'Ludhiana, Punjab' })
  @IsOptional()
  @IsString()
  location?: string

  @ApiPropertyOptional({ example: 'Punjab' })
  @IsOptional()
  @IsString()
  state?: string

  @ApiPropertyOptional({ example: 'Ludhiana' })
  @IsOptional()
  @IsString()
  district?: string

  @ApiPropertyOptional({ example: 'Wheat (HD-2967)' })
  @IsOptional()
  @IsString()
  crop?: string

  @ApiPropertyOptional({ example: 'Loamy' })
  @IsOptional()
  @IsString()
  soilType?: string

  @ApiPropertyOptional({ example: 'Tube well' })
  @IsOptional()
  @IsString()
  irrigation?: string

  @ApiPropertyOptional({ example: '2024-11-15' })
  @IsOptional()
  @IsDateString()
  sownDate?: string

  @ApiPropertyOptional({ example: '2025-04-01' })
  @IsOptional()
  @IsDateString()
  expectedHarvest?: string

  @ApiPropertyOptional({ example: 'Rotated with mustard last season' })
  @IsOptional()
  @IsString()
  notes?: string
}
