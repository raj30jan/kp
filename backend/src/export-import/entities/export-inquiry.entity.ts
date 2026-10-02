import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

/**
 * Maps to `export_inquiries` — one row per export/import enquiry submitted
 * from /export-import. session_id ties guest activity together; user_id/mobile
 * are set when known so the support team can call back and guide the user.
 */
@Entity('export_inquiries')
export class ExportInquiry {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'session_id', type: 'varchar', length: 64 })
  sessionId: string

  @Column({ name: 'user_id', type: 'char', length: 36, nullable: true })
  userId: string | null

  @Column({ type: 'varchar', length: 15, nullable: true })
  mobile: string | null

  /** EXPORT | IMPORT */
  @Column({ type: 'varchar', length: 16 })
  direction: string

  /** Marketplace-style category slug, e.g. farm, seeds, agri-machinery */
  @Column({ type: 'varchar', length: 64 })
  category: string

  /** Free-text product name, e.g. "Basmati Rice" */
  @Column({ type: 'varchar', length: 128 })
  product: string

  /** Target/source country (free text, e.g. "UAE") */
  @Column({ type: 'varchar', length: 64, nullable: true })
  country: string | null

  /** Indian state for domestic trade, or origin state for exports */
  @Column({ type: 'varchar', length: 64, nullable: true })
  state: string | null

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  quantity: string | null

  /** e.g. kg, quintal, tonne, piece, litre */
  @Column({ name: 'quantity_unit', type: 'varchar', length: 32, nullable: true })
  quantityUnit: string | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ name: 'contact_status', type: 'varchar', length: 32, default: 'PENDING' })
  contactStatus: string

  @Column({ name: 'contacted_by', type: 'char', length: 36, nullable: true })
  contactedBy: string | null

  @Column({ name: 'contacted_at', type: 'timestamp', nullable: true })
  contactedAt: Date | null

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
