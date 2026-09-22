import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ComplaintsModule } from '../complaints/complaints.module'
import { MailService } from '../common/mail.service'
import { ContactService } from './contact.service'
import { ContactController } from './contact.controller'

@Module({
  imports: [AuthModule, ComplaintsModule],
  providers: [ContactService, MailService],
  controllers: [ContactController],
})
export class ContactModule {}
