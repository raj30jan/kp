import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

/**
 * Maps to the `addresses` table (master).
 * Linked to any entity through `entity_addresses` (detail).
 */
@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @Column({ name: 'line_1', type: 'varchar', length: 255 })
  line1: string

  @Column({ name: 'line_2', type: 'varchar', length: 255, nullable: true })
  line2: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  landmark: string | null

  @Column({ name: 'city_id', type: 'bigint', nullable: true })
  cityId: number | null

  @Column({ name: 'state_id', type: 'bigint', nullable: true })
  stateId: number | null

  @Column({ name: 'country_id', type: 'bigint', nullable: true })
  countryId: number | null

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: string | null

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: string | null

  @Column({ name: 'address_type', type: 'varchar', length: 32, nullable: true })
  addressType: string | null

  @Column({ name: 'is_primary', type: 'tinyint', default: 0 })
  isPrimary: number

  @Column({ name: 'status_id', type: 'bigint' })
  statusId: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null
}
