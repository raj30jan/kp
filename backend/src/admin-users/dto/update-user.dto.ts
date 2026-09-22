import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: ['user', 'agent', 'admin', 'super_admin'] })
  @IsOptional()
  @IsIn(['user', 'agent', 'admin', 'super_admin'])
  role?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string

  @ApiPropertyOptional({ enum: [0, 1] })
  @IsOptional()
  isActive?: number
}
