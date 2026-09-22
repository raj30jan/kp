import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export interface ProductImage {
  full: string
  thumb: string
}

@Entity('marketplace_products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'seller_id', type: 'char', length: 36, nullable: true })
  sellerId: string | null

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ name: 'title_hi', type: 'varchar', length: 255, nullable: true })
  titleHi: string | null

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 64 })
  category: string

  @Column({ name: 'sub_category', type: 'varchar', length: 64, nullable: true })
  subCategory: string | null

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number

  @Column({ name: 'price_unit', type: 'varchar', length: 32, default: 'per_kg' })
  priceUnit: string

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  quantity: number | null

  @Column({ name: 'quantity_unit', type: 'varchar', length: 32, nullable: true })
  quantityUnit: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null

  // GPS coordinates of the listing — mainly used for land/property so buyers
  // can see the exact plot location on a map.
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  state: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  district: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile: string | null

  @Column({ type: 'varchar', length: 128, nullable: true })
  email: string | null

  @Column({ name: 'image_urls', type: 'json', nullable: true })
  imageUrls: ProductImage[] | null

  // Optional single video clip (<= 50 MB after server-side compression).
  @Column({ name: 'video_url', type: 'varchar', length: 512, nullable: true })
  videoUrl: string | null

  // pending (awaiting admin approval) | active | expired | rejected | deleted
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
