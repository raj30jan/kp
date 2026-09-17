import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString } from 'class-validator'

export class SocialLoginDto {
  @ApiProperty({ enum: ['google', 'facebook'], example: 'google' })
  @IsIn(['google', 'facebook'])
  provider: 'google' | 'facebook'

  @ApiProperty({
    description:
      'Google: the ID token returned by Google Sign-In on the frontend. ' +
      'Facebook: the access token returned by the Facebook Login SDK.',
  })
  @IsNotEmpty()
  @IsString()
  token: string
}
