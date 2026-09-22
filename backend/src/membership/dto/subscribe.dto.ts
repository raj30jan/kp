import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length } from 'class-validator'

export class SubscribeDto {
  @ApiProperty({ example: 'quarterly', description: 'Code of an active membership plan (see GET /membership/plans)' })
  @IsNotEmpty()
  @IsString()
  planCode: string

  @ApiProperty({ example: '312345678901', description: 'UPI transaction reference / UTR from the payment app after scanning the QR' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 64)
  paymentReference: string
}
