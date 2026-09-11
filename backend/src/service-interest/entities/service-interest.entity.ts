import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

/**
 * Maps to `service_interest_history` — one row per service selection on the
 * home page. session_id ties guest activity together; user_id/mobile are set
 * when known so the support team can call back and guide the user.
 */
@Entity('service_interest_history')
export class ServiceInterest {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'session_id', type: 'varchar', length: 64 })
  sessionId: string

  @Column({ name: 'user_id', type: 'char', length: 36, nullable: true })
  userId: string | null

  @Column({ type: 'varchar', length: 15, nullable: true })
  mobile: string | null

  @Column({ name: 'service_code', type: 'varchar', length: 64 })
  serviceCode: string

  @Column({ name: 'service_name', type: 'varchar', length: 128 })
  serviceName: string

  @Column({ name: 'source_page', type: 'varchar', length: 64, nullable: true })
  sourcePage: string | null

  @Column({ name: 'contact_status', type: 'varchar', length: 32, default: 'PENDING' })
  contactStatus: string

  @Column({ name: 'contacted_by', type: 'char', length: 36, nullable: true })
  contactedBy: string | null

  @Column({ name: 'contacted_at', type: 'timestamp', nullable: true })
  contactedAt: Date | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
