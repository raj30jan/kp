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

/**
 * Section whitelists — a product belongs to a group when its category equals
 * or starts with one of these prefixes. `food` covers everything a human can
 * eat (produce, grains, dairy, dry fruits, packed food); `land` is property;
 * `animals` is the livestock market. Stray produce slugs (e.g. a product filed
 * directly under 'onion') are included so miscategorized food still shows.
 */
export const PRODUCT_GROUP_PREFIXES: Record<string, string[]> = {
  food: [
    'vegetables', 'fruits', 'crops', 'dairy', 'dry-fruits', 'pulses', 'rice',
    'grains', 'oilseeds', 'edible-oils', 'spices', 'beverages', 'honey',
    'organic-products', 'food', 'grocery', 'packed-food',
    'onion', 'potato', 'tomato', 'mango', 'banana', 'apple', 'garlic',
    'ginger', 'wheat', 'maize', 'sugarcane',
  ],
  land: ['land'],
  animals: [
    'livestock', 'poultry', 'fisheries', 'animal', 'animals', 'cattle',
    'goat', 'goats', 'buffalo', 'sheep', 'fish', 'cow', 'horse',
  ],
}

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

  @ApiPropertyOptional({
    enum: ['food', 'land', 'animals'],
    description: 'Section filter — food (eatables only), land (property), animals (livestock market). Ignored when category is set.',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(['food', 'land', 'animals'])
  group?: string

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
