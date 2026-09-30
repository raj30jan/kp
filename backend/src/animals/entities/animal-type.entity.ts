import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { AnimalBreed } from './animal-breed.entity'

/**
 * Lookup table of animal species/categories (Cow, Buffalo, Goat, …).
 * Kept separate so listing never stores a free-text type — normalized 3NF.
 */
@Entity('animal_types')
export class AnimalType {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  /** Stable machine code: 'cow', 'buffalo', 'goat', … */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  code: string

  @Column({ type: 'varchar', length: 128 })
  name: string

  @Column({ name: 'name_hi', type: 'varchar', length: 128, nullable: true })
  nameHi: string | null

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => AnimalBreed, (b) => b.type)
  breeds: AnimalBreed[]
}
