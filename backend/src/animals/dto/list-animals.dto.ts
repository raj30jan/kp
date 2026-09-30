import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'

/** Filters for the public animal browse list. */
export class ListAnimalsDto {
  @ApiPropertyOptional({ description: 'animal_types.id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  animalTypeId?: number

  @ApiPropertyOptional({ description: 'animal_breeds.id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  breedId?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  limit?: number

  @ApiPropertyOptional({ description: 'newest | price_asc | price_desc | milk_desc' })
  @IsOptional()
  @IsString()
  sort?: string
}
