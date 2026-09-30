import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator'

/** Multipart sell-animal payload — mirrors the animall.in listing fields. */
export class CreateAnimalDto {
  @ApiProperty({ example: 'Gir Cow — 12L/day, 2nd lactation' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 255)
  title: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ example: '1', description: 'animal_types.id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  animalTypeId: number

  @ApiPropertyOptional({ example: '3', description: 'animal_breeds.id (must belong to animalTypeId)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  breedId?: number

  @ApiPropertyOptional({ example: 'female', description: 'male | female' })
  @IsOptional()
  @IsString()
  gender?: string

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(40)
  ageYears?: number

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(11)
  ageMonths?: number

  @ApiPropertyOptional({ example: 12.5, description: 'Milk yield litres/day' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(80)
  milkCapacity?: number

  @ApiPropertyOptional({ example: 2, description: 'ब्यात — lactation number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  lactationNumber?: number

  @ApiPropertyOptional({ example: 1, description: '1 = pregnant, 0 = not' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  isPregnant?: number

  @ApiPropertyOptional({ example: 5, description: 'Months pregnant (0–12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(12)
  monthsPregnant?: number

  @ApiProperty({ example: 85000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number

  @ApiPropertyOptional({ example: 1, description: '1 = price negotiable, 0 = fixed' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  isNegotiable?: number

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty({ message: 'Mobile number is required for every listing' })
  @Matches(/^[0-9]{10}$/, { message: 'Mobile must be a 10-digit number' })
  mobile: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ example: 'Village Rampur, Fatehabad' })
  @IsOptional()
  @IsString()
  location?: string

  @ApiPropertyOptional({ example: 'Haryana' })
  @IsOptional()
  @IsString()
  state?: string

  @ApiPropertyOptional({ example: 'Fatehabad' })
  @IsOptional()
  @IsString()
  district?: string

  @ApiPropertyOptional({ example: 29.5135 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number

  @ApiPropertyOptional({ example: 75.4556 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number
}
