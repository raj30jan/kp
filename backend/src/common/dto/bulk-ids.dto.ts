import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator'

/** Generic "selected row IDs" payload used by every admin-UI bulk action. */
export class BulkIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[]
}
