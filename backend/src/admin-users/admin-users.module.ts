import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StatusMaster } from '../common/entities/status-master.entity'
import { User } from '../users/entities/user.entity'
import { AdminUsersService } from './admin-users.service'
import { AdminUsersController } from './admin-users.controller'

@Module({
  imports: [TypeOrmModule.forFeature([User, StatusMaster])],
  providers: [AdminUsersService],
  controllers: [AdminUsersController],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
