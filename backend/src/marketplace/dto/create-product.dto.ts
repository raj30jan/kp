import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min, Matches } from 'class-validator'

export class CreateProductDto {
  @ApiProperty({ example: 'Fresh Organic Tomatoes' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 255)
  title: string

  @ApiPropertyOptional({ example: 'Farm fresh organic tomatoes, 50 kg available.' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ example: 'vegetables', description: 'Product category' })
  @IsNotEmpty()
  @IsString()
  category: string

  @ApiPropertyOptional({ example: 'tomato' })
  @IsOptional()
  @IsString()
  subCategory?: string

  @ApiProperty({ example: 25.0, description: 'Price value' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number

  @ApiProperty({ example: 'per_kg', description: 'per_kg | per_piece | per_quintal | per_litre' })
  @IsNotEmpty()
  @Matches(/^(per_kg|per_piece|per_quintal|per_litre)$/)
  priceUnit: string

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  quantityUnit?: string

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

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  mobile?: string

  @ApiPropertyOptional({ example: 'seller@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string
}
