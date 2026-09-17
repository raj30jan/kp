import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue } from 'bullmq'
import { NotifyPayload } from './notification.types'
import { NOTIFICATION_QUEUE_NAME } from './notification.constants'

export { NotifyPayload }

/**
 * Central notification fan-out used across the app whenever a user needs to
 * be told about an event on their account (a like/dislike, a buyer contact,
 * feedback, or a product edit).
 *
 * `notifyUser()` only enqueues a BullMQ job onto Redis and returns
 * immediately — the actual send (email, with SMS fallback — see
 * common/sms.service.ts) plus the `notifications`/`admin_notifications` DB
 * writes happen in NotificationProcessor (the queue's worker). This keeps a
 * slow Brevo/SMS API call from blocking the request that triggered the
 * notification (e.g. a buyer liking/contacting a product), and failed sends
 * are retried automatically instead of being silently lost.
 */
@Injectable()
export class NotificationService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name)
  private readonly queue: Queue<NotifyPayload>

  constructor(private readonly config: ConfigService) {
    this.queue = new Queue<NotifyPayload>(NOTIFICATION_QUEUE_NAME, {
      connection: {
        host: this.config.get<string>('REDIS_HOST'),
        port: this.config.get<number>('REDIS_PORT'),
        password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
      },
    })
  }

  async notifyUser(payload: NotifyPayload): Promise<void> {
    try {
      await this.queue.add('notify', payload)
    } catch (err) {
      this.logger.warn(`Failed to enqueue notification for ${payload.userId}: ${(err as Error).message}`)
    }
  }

  async onModuleDestroy() {
    await this.queue.close()
  }
}
