import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

/** Maps to `notifications` — every notification delivered/attempted to a user. */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId: string

  @Column({ type: 'enum', enum: ['email', 'sms', 'app'] })
  channel: 'email' | 'sms' | 'app'

  @Column({ type: 'varchar', length: 64 })
  type: string

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ type: 'text' })
  message: string

  @Column({ name: 'related_type', type: 'varchar', length: 64, nullable: true })
  relatedType: string | null

  @Column({ name: 'related_id', type: 'char', length: 36, nullable: true })
  relatedId: string | null

  @Column({ type: 'enum', enum: ['sent', 'failed', 'skipped'], default: 'skipped' })
  status: 'sent' | 'failed' | 'skipped'

  @Column({ name: 'is_read', type: 'tinyint', default: 0 })
  isRead: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
