import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

/** Maps to `product_reactions` — one like/dislike per (product, user). */
@Entity('product_reactions')
export class ProductReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'product_id', type: 'char', length: 36 })
  productId: string

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId: string

  @Column({ type: 'enum', enum: ['like', 'dislike'] })
  reaction: 'like' | 'dislike'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
