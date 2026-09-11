import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

/**
 * Maps to the `entity_addresses` join table.
 * Links an address row to any business entity, e.g.
 * entity_type='user', entity_id=<user uuid>.
 */
@Entity('entity_addresses')
export class EntityAddress {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @Column({ name: 'entity_type', type: 'varchar', length: 64 })
  entityType: string

  @Column({ name: 'entity_id', type: 'char', length: 36 })
  entityId: string

  @Column({ name: 'address_id', type: 'bigint' })
  addressId: number

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
