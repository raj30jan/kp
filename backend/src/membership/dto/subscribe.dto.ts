import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

export class SubscribeDto {
  @ApiProperty({ example: 'quarterly', description: 'Plan code (currently only "quarterly")' })
  @IsIn(['quarterly'])
  planCode: string

  @ApiPropertyOptional({ description: 'Payment gateway reference/transaction id (once a gateway is wired)' })
  @IsOptional()
  @IsString()
  paymentReference?: string
}
