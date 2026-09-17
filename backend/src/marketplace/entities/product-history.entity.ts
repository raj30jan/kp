import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Maps to `marketplace_product_history`. One row per changed field per edit,
 * so a seller/admin can see exactly what changed, when, and by whom.
 */
@Entity('marketplace_product_history')
export class MarketplaceProductHistory {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'product_id', type: 'char', length: 36 })
  productId: string

  @Column({ name: 'field_name', type: 'varchar', length: 64 })
  fieldName: string

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue: string | null

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue: string | null

  @Column({ name: 'changed_by', type: 'char', length: 36, nullable: true })
  changedBy: string | null

  @Column({ name: 'changed_by_role', type: 'varchar', length: 20, nullable: true })
  changedByRole: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
