import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Maps to `product_interests` — a buyer's bookmark on a listing.
 * 'wishlist' = saved for later, 'cart' = buying bucket. One row per
 * (product, user, type) so a product can sit in both lists at once.
 */
@Entity('product_interests')
export class ProductInterest {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'product_id', type: 'char', length: 36 })
  productId: string

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId: string

  @Column({ type: 'enum', enum: ['wishlist', 'cart'] })
  type: 'wishlist' | 'cart'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
