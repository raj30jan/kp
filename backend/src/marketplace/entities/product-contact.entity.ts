import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Records a buyer revealing a seller's contact details for a product.
 * This is our proxy for a "purchase interaction" since the marketplace is
 * OLX-style (direct contact) with no cart/checkout — used for the buyer's
 * lifetime purchase history and the free-tier 5-contact cap.
 */
@Entity('product_contacts')
export class ProductContact {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'product_id', type: 'char', length: 36 })
  productId: string

  @Column({ name: 'buyer_id', type: 'char', length: 36 })
  buyerId: string

  @Column({ name: 'seller_id', type: 'char', length: 36 })
  sellerId: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
