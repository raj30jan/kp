import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator'

export const SERVICE_TYPES = [
  'labour',
  'machinery',
  'machinery_driver',
  'machine_operator',
  'tutor',
  'doctor',
  'veterinary',
  'electrician',
  'technician',
  'nursing_attendant',
  'snake_catcher',
  'plumber',
  'car_painter',
  'motor_mechanic',
  'mason',
  'cook',
  'tent_service',
  'ro_water_service',
  'milkman',
  'blood_donor',
  'scrap_dealer',
  'plant_nursery',
  'priest',
  'dry_cleaner',
  'ac_fridge_service',
  'tyre_welding',
  'barber',
  'septic_tank_cleaner',
  'pipe_fitter',
  'insurance_agent',
  'laundry',
  'water_tank_cleaner',
  'gardener',
  'ironing_service',
  'car_wash',
  'ambulance',
  'decorator_florist',
  'mehendi_artist',
  'bistar_house',
  'halwai',
  'waiter',
  'venue_provider',
  'caterer',
  'photographer',
  'dj_sound',
  'makeup_artist',
  'wedding_planner',
  'cake_supplier',
  'event_rental',
  'choreographer',
  'dhol_musician',
  'architect',
  'structural_engineer',
  'interior_designer',
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

  @ApiProperty({ example: 5, description: 'Total years of experience in this profession' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experienceYears: number

  @ApiProperty({ example: 'House no. 12, Main Road, near bus stand' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 500)
  address: string

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

  @ApiPropertyOptional({ example: '125053' })
  @IsOptional()
  @IsString()
  @Length(0, 10)
  pincode?: string

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

  @ApiPropertyOptional({ example: 'Bhattu' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  tehsil?: string

  @ApiPropertyOptional({ example: 'Rampur' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  village?: string

  @ApiPropertyOptional({ example: '125053' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  pincode?: string

  @ApiPropertyOptional({ example: 'name', description: 'Sort order: name (A→Z, default) | newest' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  sort?: string

  @ApiPropertyOptional({ example: '29.5', description: 'Caller latitude — enables nearest-first + radius filter' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  lat?: string

  @ApiPropertyOptional({ example: '75.4', description: 'Caller longitude' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  lng?: string

  @ApiPropertyOptional({ example: '50', description: 'Search radius in km (0 = no limit)' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  radius?: string

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  page?: string

  @ApiPropertyOptional({ example: '12' })
  @IsOptional()
  limit?: string
}
