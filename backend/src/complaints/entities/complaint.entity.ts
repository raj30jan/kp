import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'char', length: 36, nullable: true })
  userId: string | null

  // legal | terms | policy | fraud | other
  @Column({ type: 'varchar', length: 32 })
  category: string

  @Column({ type: 'varchar', length: 255 })
  subject: string

  @Column({ type: 'text' })
  description: string

  @Column({ name: 'contact_mobile', type: 'varchar', length: 20, nullable: true })
  contactMobile: string | null

  @Column({ name: 'contact_email', type: 'varchar', length: 128, nullable: true })
  contactEmail: string | null

  // open | in_review | resolved | rejected
  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string | null

  @Column({ name: 'resolved_by', type: 'char', length: 36, nullable: true })
  resolvedBy: string | null

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
