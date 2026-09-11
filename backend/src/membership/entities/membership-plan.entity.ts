import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('membership_plans')
export class MembershipPlan {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 32, unique: true })
  code: string

  @Column({ type: 'varchar', length: 64 })
  name: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: string

  @Column({ name: 'billing_cycle', type: 'varchar', length: 16, default: 'lifetime' })
  billingCycle: string

  @Column({ name: 'duration_days', type: 'int', nullable: true })
  durationDays: number | null

  @Column({ name: 'free_listing_limit', type: 'int', nullable: true })
  freeListingLimit: number | null

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
