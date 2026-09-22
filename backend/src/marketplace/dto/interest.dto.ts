import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsUUID } from 'class-validator'

export class InterestDto {
  @ApiProperty({ description: 'Product listing id' })
  @IsUUID()
  productId: string

  @ApiProperty({ enum: ['wishlist', 'cart'], description: 'wishlist = saved for later, cart = buying bucket' })
  @IsIn(['wishlist', 'cart'])
  type: 'wishlist' | 'cart'
}
