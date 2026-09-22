import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

/**
 * Key/value store for super-admin managed platform configuration
 * (membership payment QR code, UPI id, payee name, ...). One row per key.
 */
@Entity({ name: 'site_settings' })
export class SiteSetting {
  @PrimaryColumn({ name: 'setting_key', type: 'varchar', length: 64 })
  key: string

  @Column({ name: 'setting_value', type: 'text', nullable: true })
  value: string | null

  @Column({ name: 'updated_by', type: 'char', length: 36, nullable: true })
  updatedBy: string | null

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
