import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { AnimalType } from './animal-type.entity'
import { AnimalBreed } from './animal-breed.entity'
import { AnimalListingImage } from './animal-listing-image.entity'

/**
 * A single animal listed for sale (animall.in-style).
 * Images live in animal_listing_images (one row each) — 3NF, no JSON blob.
 * Animal attributes are split into atomic columns (age years/months,
 * milk capacity, lactation/ब्यात, pregnancy) rather than a composite field.
 */
@Entity('animal_listings')
export class AnimalListing {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ name: 'seller_id', type: 'char', length: 36 })
  sellerId: string

  @Index()
  @Column({ name: 'animal_type_id', type: 'bigint' })
  animalTypeId: string

  @Index()
  @Column({ name: 'breed_id', type: 'bigint', nullable: true })
  breedId: string | null

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 16, default: 'female' }) // male | female
  gender: string

  @Column({ name: 'age_years', type: 'int', nullable: true })
  ageYears: number | null

  @Column({ name: 'age_months', type: 'int', nullable: true })
  ageMonths: number | null

  /** Milk yield in litres/day — the key buying signal for dairy animals. */
  @Column({ name: 'milk_capacity', type: 'decimal', precision: 5, scale: 2, nullable: true })
  milkCapacity: number | null

  /** ब्यात — which lactation / how many calves the animal has given. */
  @Column({ name: 'lactation_number', type: 'int', nullable: true })
  lactationNumber: number | null

  @Column({ name: 'is_pregnant', type: 'tinyint', default: 0 })
  isPregnant: number

  @Column({ name: 'months_pregnant', type: 'int', nullable: true })
  monthsPregnant: number | null

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number

  @Column({ name: 'is_negotiable', type: 'tinyint', default: 1 })
  isNegotiable: number

  @Column({ type: 'varchar', length: 20 })
  mobile: string

  @Column({ type: 'varchar', length: 128, nullable: true })
  email: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  state: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  district: string | null

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null

  @Column({ name: 'video_url', type: 'varchar', length: 512, nullable: true })
  videoUrl: string | null

  /** pending | active | rejected | deleted */
  @Index()
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

  // --- Relations ---
  @ManyToOne(() => AnimalType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'animal_type_id' })
  type: AnimalType

  @ManyToOne(() => AnimalBreed, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'breed_id' })
  breed: AnimalBreed | null

  @OneToMany(() => AnimalListingImage, (img) => img.listing)
  images: AnimalListingImage[]
}
