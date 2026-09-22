import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator'

export const SERVICE_TYPES = [
  'labour',
  'machinery',
  'veterinary',
  'patwari',
  'loan_agent',
  'transport',
  'other',
] as const

export const RATE_UNITS = [
  'per_day',
  'per_hour',
  'per_acre',
  'per_visit',
  'per_month',
  'fixed',
  'negotiable',
] as const

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value

export class CreateServiceDto {
  @ApiProperty({ example: 'machinery', description: `One of: ${SERVICE_TYPES.join(' | ')}` })
  @IsNotEmpty()
  @IsIn(SERVICE_TYPES as unknown as string[], { message: `serviceType must be one of: ${SERVICE_TYPES.join(', ')}` })
  serviceType: string

  @ApiProperty({ example: 'Tractor with driver for hire' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 255)
  title: string

  @ApiPropertyOptional({ example: 'किराए पर ट्रैक्टर ड्राइवर सहित' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  titleHi?: string

  @ApiPropertyOptional({ example: 'Mahindra 575 with rotavator, available for ploughing and trolley work.' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ example: 1500, description: 'Rate value — omit when negotiable' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rate?: number

  @ApiProperty({ example: 'per_day', description: `One of: ${RATE_UNITS.join(' | ')}` })
  @IsNotEmpty()
  @IsIn(RATE_UNITS as unknown as string[], { message: `rateUnit must be one of: ${RATE_UNITS.join(', ')}` })
  rateUnit: string

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'mobile must be a valid 10-digit Indian number' })
  mobile: string

  @ApiPropertyOptional({ example: 'Rampur' })
  @IsOptional()
  @IsString()
  @Length(0, 128)
  village?: string

  @ApiPropertyOptional({ example: 'Fatehabad' })
  @IsOptional()
  @IsString()
  @Length(0, 64)
  tehsil?: string

  @ApiPropertyOptional({ example: 'Fatehabad' })
  @IsOptional()
  @IsString()
  @Length(0, 64)
  district?: string

  @ApiPropertyOptional({ example: 'Haryana' })
  @IsOptional()
  @IsString()
  @Length(0, 64)
  state?: string

  @ApiPropertyOptional({ example: 29.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number

  @ApiPropertyOptional({ example: 75.4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

export class ListServicesDto {
  @ApiPropertyOptional({ description: `Filter by service type — one of: ${SERVICE_TYPES.join(' | ')}` })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  type?: string

  @ApiPropertyOptional({ example: 'tractor', description: 'Search in title/description' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({ example: 'Haryana' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  state?: string

  @ApiPropertyOptional({ example: 'Fatehabad' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  district?: string

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  page?: string

  @ApiPropertyOptional({ example: '12' })
  @IsOptional()
  limit?: string
}
