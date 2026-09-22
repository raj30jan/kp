import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

/**
 * A service-provider listing — hire labour, machinery, veterinary doctors,
 * patwari, loan/subsidy agents, transport. Distinct from marketplace_products:
 * services charge a rate (per day/hour/acre/visit) and hold no stock.
 * Lifecycle mirrors products: pending -> active -> expired / rejected,
 * and every seller edit/reactivation goes back to pending for admin review.
 */
@Entity('service_providers')
export class ServiceProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'provider_id', type: 'char', length: 36, nullable: true })
  providerId: string | null

  // labour | machinery | veterinary | patwari | loan_agent | transport | other
  @Column({ name: 'service_type', type: 'varchar', length: 64 })
  serviceType: string

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ name: 'title_hi', type: 'varchar', length: 255, nullable: true })
  titleHi: string | null

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  rate: number | null

  // per_day | per_hour | per_acre | per_visit | per_month | fixed | negotiable
  @Column({ name: 'rate_unit', type: 'varchar', length: 32, default: 'per_day' })
  rateUnit: string

  @Column({ type: 'varchar', length: 20 })
  mobile: string

  @Column({ type: 'varchar', length: 128, nullable: true })
  village: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  tehsil: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  district: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  state: string | null

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null

  @Column({ name: 'image_urls', type: 'json', nullable: true })
  imageUrls: any

  // pending | active | expired | rejected
  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: string

  @Column({ name: 'activated_at', type: 'timestamp', nullable: true })
  activatedAt: Date | null

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null

  @Column({ type: 'bigint', default: 0 })
  views: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
