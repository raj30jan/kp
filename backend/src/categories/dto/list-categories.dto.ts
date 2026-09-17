import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

export class ListCategoriesDto {
  @ApiPropertyOptional({ description: 'Search by name or slug' })
  @IsString()
  @IsOptional()
  q?: string

  @ApiPropertyOptional({ enum: ['product', 'service'] })
  @IsIn(['product', 'service'])
  @IsOptional()
  type?: string

  @ApiPropertyOptional({ description: 'Filter by parent ID (use "null" for roots)' })
  @IsString()
  @IsOptional()
  parentId?: string

  @ApiPropertyOptional({ description: 'Only leaf categories (1) or only non-leaf (0)' })
  @IsIn(['0', '1'])
  @IsString()
  @IsOptional()
  isLeaf?: string

  @ApiPropertyOptional({ description: 'Only active (1) or only inactive (0)' })
  @IsIn(['0', '1'])
  @IsString()
  @IsOptional()
  isActive?: string

  @ApiPropertyOptional({ default: '1' })
  @IsString()
  @IsOptional()
  page?: string

  @ApiPropertyOptional({ default: '20' })
  @IsString()
  @IsOptional()
  limit?: string

  @ApiPropertyOptional({ default: 'displayOrder' })
  @IsString()
  @IsOptional()
  sort?: string

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  dir?: 'ASC' | 'DESC'
}
