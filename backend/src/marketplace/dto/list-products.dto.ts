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
  'land',
  'other',
] as const

/** Swagger "Try it out" sends empty strings for untouched fields — treat as not provided. */
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value

export class ListProductsDto {
  @ApiPropertyOptional({
    description: 'Filter by category slug (top-level or subcategory, e.g. land or land-agricultural) — leave empty for all',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
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
