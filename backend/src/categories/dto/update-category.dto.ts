import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString, IsInt, Min, MaxLength } from 'class-validator'

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(128)
  name?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(128)
  slug?: string

  @ApiPropertyOptional({ description: 'Move to a new parent (null = root)' })
  @IsString()
  @IsOptional()
  parentId?: string | null

  @ApiPropertyOptional({ enum: ['product', 'service'] })
  @IsIn(['product', 'service'])
  @IsOptional()
  type?: string

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(64)
  icon?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '1 = active, 0 = inactive' })
  @IsInt()
  @IsOptional()
  isActive?: number
}
