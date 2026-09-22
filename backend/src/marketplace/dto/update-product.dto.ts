import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEmail, IsIn, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator'
import { PRICE_UNIT_CODES, PRICE_UNIT_REGEX, QUANTITY_UNIT_CODES } from '../units'

/**
 * Fields a seller may self-edit from their dashboard. `title` is
 * intentionally NOT included — sellers cannot change a listing's title
 * after it is created (ProductService.updateBySeller enforces this even if
 * a client sends one anyway). Every changed field is written to
 * `marketplace_product_history` before being applied.
 */
export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCategory?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @ApiPropertyOptional({ description: `One of: ${PRICE_UNIT_CODES.join(' | ')}` })
  @IsOptional()
  @Matches(PRICE_UNIT_REGEX, { message: `priceUnit must be one of: ${PRICE_UNIT_CODES.join(', ')}` })
  priceUnit?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number

  @ApiPropertyOptional({ description: `One of: ${QUANTITY_UNIT_CODES.join(' | ')}` })
  @IsOptional()
  @IsIn(QUANTITY_UNIT_CODES, { message: `quantityUnit must be one of: ${QUANTITY_UNIT_CODES.join(', ')}` })
  quantityUnit?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string

  @ApiPropertyOptional({ description: 'GPS latitude of the listing/land plot' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number

  @ApiPropertyOptional({ description: 'GPS longitude of the listing/land plot' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number

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
  @Matches(/^[0-9]{10}$/, { message: 'Mobile must be a 10-digit number' })
  mobile?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string
}
