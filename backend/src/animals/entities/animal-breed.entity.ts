import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { AnimalType } from './animal-type.entity'

/**
 * Breed within an animal type (e.g. Gir → cow, Murrah → buffalo).
 * Every breed rows to exactly one type — no transitive dependency (3NF).
 */
@Entity('animal_breeds')
export class AnimalBreed {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Index()
  @Column({ name: 'animal_type_id', type: 'bigint' })
  animalTypeId: string

  @Column({ type: 'varchar', length: 128 })
  name: string

  @Column({ name: 'name_hi', type: 'varchar', length: 128, nullable: true })
  nameHi: string | null

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => AnimalType, (t) => t.breeds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_type_id' })
  type: AnimalType
}
