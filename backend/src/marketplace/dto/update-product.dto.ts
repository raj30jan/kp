import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEmail, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator'

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

  @ApiPropertyOptional({ description: 'per_kg | per_piece | per_quintal | per_litre' })
  @IsOptional()
  @Matches(/^(per_kg|per_piece|per_quintal|per_litre)$/)
  priceUnit?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quantityUnit?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string

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
  @IsString()
  mobile?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string
}
