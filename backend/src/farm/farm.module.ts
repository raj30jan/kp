import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Farm } from './entities/farm.entity'
import { FarmService } from './farm.service'
import { FarmController } from './farm.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Farm])],
  providers: [FarmService],
  controllers: [FarmController],
  exports: [FarmService],
})
export class FarmModule {}
