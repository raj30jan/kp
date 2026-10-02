import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

/**
 * One row per unique browser session — powers the public visitor counter
 * shown in the footer. A session counts once no matter how many pages it views.
 */
@Entity('site_visits')
export class SiteVisit {
  @PrimaryGeneratedColumn()
  id: number

  @Index({ unique: true })
  @Column({ name: 'session_id', type: 'varchar', length: 64 })
  sessionId: string

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
