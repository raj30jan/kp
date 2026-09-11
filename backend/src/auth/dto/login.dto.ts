import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({
    example: 'rajinder@example.com',
    description: 'Email address (or 10-digit mobile) used at registration',
  })
  @IsNotEmpty()
  @IsString()
  identifier: string

  @ApiProperty({ example: 'StrongPass@123' })
  @IsNotEmpty()
  @MinLength(8)
  password: string
}
