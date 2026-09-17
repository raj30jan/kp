import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString, IsInt, Min, MaxLength } from 'class-validator'

export class CreateCategoryDto {
  @ApiProperty({ example: 'Seeds', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string

  @ApiProperty({ example: 'seeds', description: 'URL-friendly slug (auto-generated if blank)' })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  slug?: string

  @ApiPropertyOptional({ example: '1', description: 'Parent category ID (null = root)' })
  @IsString()
  @IsOptional()
  parentId?: string | null

  @ApiProperty({ enum: ['product', 'service'], default: 'product' })
  @IsIn(['product', 'service'])
  @IsOptional()
  type?: string

  @ApiPropertyOptional({ example: 0, description: 'Display/sort order (lower = first)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number

  @ApiPropertyOptional({ example: '/uploads/categories/icon-123.png', description: 'Icon image path' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  icon?: string

  @ApiPropertyOptional({ description: 'Description / notes' })
  @IsString()
  @IsOptional()
  description?: string
}
