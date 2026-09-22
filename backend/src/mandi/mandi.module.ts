import { Module } from '@nestjs/common'
import { MandiController } from './mandi.controller'
import { MandiService } from './mandi.service'

@Module({
  controllers: [MandiController],
  providers: [MandiService],
})
export class MandiModule {}
