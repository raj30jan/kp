import { ApiProperty } from '@nestjs/swagger'
import { IsIn } from 'class-validator'

export class ReactDto {
  @ApiProperty({ enum: ['like', 'dislike'] })
  @IsIn(['like', 'dislike'])
  reaction: 'like' | 'dislike'
}
