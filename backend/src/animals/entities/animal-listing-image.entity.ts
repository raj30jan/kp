import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { AnimalListing } from './animal-listing.entity'

/**
 * One image per row for an animal listing (normalized — replaces the JSON
 * image_urls array used by marketplace_products).
 */
@Entity('animal_listing_images')
export class AnimalListingImage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Index()
  @Column({ name: 'listing_id', type: 'char', length: 36 })
  listingId: string

  @Column({ name: 'image_url', type: 'varchar', length: 512 })
  imageUrl: string

  @Column({ name: 'thumb_url', type: 'varchar', length: 512, nullable: true })
  thumbUrl: string | null

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => AnimalListing, (l) => l.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: AnimalListing
}
