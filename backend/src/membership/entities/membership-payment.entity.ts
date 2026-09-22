import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

/**
 * One row per membership payment attempt (UPI QR + UTR, or an admin manual
 * grant). The subscription row is the entitlement; this is the money trail:
 * who paid what, with which reference, and which admin verified/rejected it.
 */
@Entity('membership_payments')
export class MembershipPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'subscription_id', type: 'char', length: 36, nullable: true })
  subscriptionId: string | null

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId: string

  @Column({ name: 'plan_id', type: 'bigint' })
  planId: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: string

  // upi | manual
  @Column({ type: 'varchar', length: 16, default: 'upi' })
  method: string

  @Column({ name: 'payment_reference', type: 'varchar', length: 128, nullable: true })
  paymentReference: string | null

  // pending | verified | rejected
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: string

  @Column({ name: 'verified_by', type: 'char', length: 36, nullable: true })
  verifiedBy: string | null

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  remarks: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
