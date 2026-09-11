import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('membership_subscriptions')
export class MembershipSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId: string

  @Column({ name: 'plan_id', type: 'bigint' })
  planId: number

  // pending | active | expired | cancelled
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: string

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: string

  // TODO: populated once a real payment gateway (Razorpay/Stripe) is wired
  @Column({ name: 'payment_reference', type: 'varchar', length: 128, nullable: true })
  paymentReference: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
