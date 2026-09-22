import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min, Matches } from 'class-validator'
import { PRICE_UNIT_CODES, PRICE_UNIT_REGEX, QUANTITY_UNIT_CODES } from '../units'

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

  @ApiProperty({ example: 'per_kg', description: `One of: ${PRICE_UNIT_CODES.join(' | ')}` })
  @IsNotEmpty()
  @Matches(PRICE_UNIT_REGEX, { message: `priceUnit must be one of: ${PRICE_UNIT_CODES.join(', ')}` })
  priceUnit: string

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number

  @ApiPropertyOptional({ example: 'kg', description: `One of: ${QUANTITY_UNIT_CODES.join(' | ')}` })
  @IsOptional()
  @IsIn(QUANTITY_UNIT_CODES, { message: `quantityUnit must be one of: ${QUANTITY_UNIT_CODES.join(', ')}` })
  quantityUnit?: string

  @ApiPropertyOptional({ example: 'Village Rampur, Fatehabad' })
  @IsOptional()
  @IsString()
  location?: string

  @ApiPropertyOptional({ example: 29.5135, description: 'GPS latitude of the listing/land plot' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number

  @ApiPropertyOptional({ example: 75.4556, description: 'GPS longitude of the listing/land plot' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number

  @ApiPropertyOptional({ example: 'Haryana' })
  @IsOptional()
  @IsString()
  state?: string

  @ApiPropertyOptional({ example: 'Fatehabad' })
  @IsOptional()
  @IsString()
  district?: string

  @ApiProperty({ example: '9876543210', description: 'Seller / owner contact mobile — mandatory for every listing' })
  @IsNotEmpty({ message: 'Mobile number is required for every listing' })
  @Matches(/^[0-9]{10}$/, { message: 'Mobile must be a 10-digit number' })
  mobile: string

  @ApiPropertyOptional({ example: 'seller@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string
}
