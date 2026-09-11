import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsIn, IsOptional, IsString } from 'class-validator'

export const PRODUCT_CATEGORIES = [
  'crops',
  'vegetables',
  'fruits',
  'seeds',
  'tools',
  'fertilizers',
  'livestock',
  'dairy',
  'other',
] as const

/** Swagger "Try it out" sends empty strings for untouched fields — treat as not provided. */
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value

export class ListProductsDto {
  @ApiPropertyOptional({
    description: 'Filter by category — leave empty to show products from all categories',
    enum: PRODUCT_CATEGORIES,
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(PRODUCT_CATEGORIES)
  category?: string

  @ApiPropertyOptional({ example: 'tomato', description: 'Search in title/description — leave empty to skip text search' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({ example: 'Haryana', description: 'Leave empty to include all states' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  state?: string

  @ApiPropertyOptional({ example: 'Fatehabad', description: 'Leave empty to include all districts' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  district?: string

  @ApiPropertyOptional({ example: '1', description: 'Page number' })
  @IsOptional()
  page?: string

  @ApiPropertyOptional({ example: '12', description: 'Items per page' })
  @IsOptional()
  limit?: string
}
