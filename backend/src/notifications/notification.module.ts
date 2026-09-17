import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../users/entities/user.entity'
import { MailService } from '../common/mail.service'
import { SmsService } from '../common/sms.service'
import { MongoModule } from '../mongo/mongo.module'
import { Notification } from './entities/notification.entity'
import { AdminNotification } from './entities/admin-notification.entity'
import { NotificationService } from './notification.service'
import { NotificationProcessor } from './notification.processor'
import { NotificationController } from './notification.controller'

@Module({
  imports: [TypeOrmModule.forFeature([User, Notification, AdminNotification]), MongoModule],
  providers: [NotificationService, NotificationProcessor, MailService, SmsService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
