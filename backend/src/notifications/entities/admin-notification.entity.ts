import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

/** Maps to `admin_notifications` — keeps admins aware of user engagement events. */
@Entity('admin_notifications')
export class AdminNotification {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 64 })
  type: string

  @Column({ type: 'text' })
  message: string

  @Column({ name: 'related_type', type: 'varchar', length: 64, nullable: true })
  relatedType: string | null

  @Column({ name: 'related_id', type: 'char', length: 36, nullable: true })
  relatedId: string | null

  @Column({ name: 'target_user_id', type: 'char', length: 36, nullable: true })
  targetUserId: string | null

  @Column({ name: 'is_read', type: 'tinyint', default: 0 })
  isRead: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
