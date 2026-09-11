import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ['open', 'in_review', 'resolved', 'rejected'] })
  @IsIn(['open', 'in_review', 'resolved', 'rejected'])
  status: string

  @ApiPropertyOptional({ description: 'Resolution note (required when status is resolved or rejected)' })
  @IsOptional()
  @IsString()
  resolutionNote?: string
}
