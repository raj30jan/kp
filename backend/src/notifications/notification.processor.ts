import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Job, Worker } from 'bullmq'
import { Repository } from 'typeorm'
import { MailService } from '../common/mail.service'
import { SmsService } from '../common/sms.service'
import { ActivityLogService } from '../mongo/activity-log.service'
import { User } from '../users/entities/user.entity'
import { Notification } from './entities/notification.entity'
import { AdminNotification } from './entities/admin-notification.entity'
import { NotifyPayload } from './notification.types'
import { NOTIFICATION_QUEUE_NAME } from './notification.constants'

/**
 * Worker side of the notification queue (see notification.service.ts for the
 * producer). Runs in the same process as the API (BullMQ workers are just
 * background event-loop consumers backed by Redis) so no separate deployment
 * is required — but because the actual send happens off a queue, a slow
 * Brevo/SMS API call no longer blocks the HTTP request that triggered the
 * notification (like/dislike/contact/edit). Failed jobs are retried
 * automatically per the queue's `attempts`/`backoff` config (see
 * notification.service.ts).
 */
@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationProcessor.name)
  private worker: Worker<NotifyPayload> | null = null

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    @InjectRepository(AdminNotification) private readonly adminNotifRepo: Repository<AdminNotification>,
    private readonly mail: MailService,
    private readonly sms: SmsService,
    private readonly activityLog: ActivityLogService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<NotifyPayload>(
      NOTIFICATION_QUEUE_NAME,
      (job) => this.handle(job),
      {
        connection: {
          host: this.config.get<string>('REDIS_HOST'),
          port: this.config.get<number>('REDIS_PORT'),
          password: this.config.get<string>('REDIS_PASSWORD') || undefined,
        },
        concurrency: 5,
      },
    )
    this.worker.on('failed', (job, err) => {
      this.logger.warn(`notification job ${job?.id} failed: ${err.message}`)
    })
  }

  async onModuleDestroy() {
    await this.worker?.close()
  }

  private async handle(job: Job<NotifyPayload>): Promise<void> {
    const payload = job.data
    const user = await this.userRepo.findOne({ where: { id: payload.userId } })
    if (!user) return

    let channel: 'email' | 'sms' = 'email'
    let status: 'sent' | 'failed' | 'skipped' = 'skipped'

    try {
      if (user.email) {
        channel = 'email'
        const html = `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#145214;margin:0 0 8px">KisanPatrika</h2>
            <h3 style="margin:0 0 8px">${payload.title}</h3>
            <p style="color:#374151">${payload.message}</p>
          </div>`
        const sent = await this.mail.sendGenericEmail(user.email, payload.title, html, payload.message)
        status = sent ? 'sent' : 'failed'
      } else if (user.mobile) {
        channel = 'sms'
        const sent = await this.sms.sendSms(user.mobile, `${payload.title}: ${payload.message}`)
        status = sent ? 'sent' : 'failed'
      }
    } catch (err) {
      this.logger.warn(`notification job ${job.id} failed for ${payload.userId}: ${(err as Error).message}`)
      status = 'failed'
      throw err // let BullMQ retry per the queue's attempts/backoff config
    } finally {
      await this.notifRepo.save(
        this.notifRepo.create({
          userId: payload.userId,
          channel,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          relatedType: payload.relatedType || null,
          relatedId: payload.relatedId || null,
          status,
        }),
      )
      await this.adminNotifRepo.save(
        this.adminNotifRepo.create({
          type: payload.type,
          message: `${payload.title} — ${payload.message} (user: ${user.displayName || user.email || user.mobile})`,
          relatedType: payload.relatedType || null,
          relatedId: payload.relatedId || null,
          targetUserId: payload.userId,
        }),
      )
      this.activityLog.log({
        action: `notification.${payload.type}`,
        userId: payload.userId,
        meta: { channel, status, title: payload.title },
      })
    }
  }
}
