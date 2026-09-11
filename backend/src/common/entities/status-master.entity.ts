import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Maps to the `status_master` table.
 * Generic status lookup: (entity_type, code) -> id.
 * Example: ('user', 'active') or ('product', 'published').
 */
@Entity('status_master')
export class StatusMaster {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @Column({ name: 'entity_type', type: 'varchar', length: 64 })
  entityType: string

  @Column({ type: 'varchar', length: 64 })
  code: string

  @Column({ type: 'varchar', length: 128 })
  label: string
}
