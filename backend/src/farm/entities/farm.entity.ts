import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

/** Maps to the `farms` table — one row per plot a farmer manages. */
@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ name: 'owner_id', type: 'char', length: 36 })
  ownerId: string

  @Column({ type: 'varchar', length: 128 })
  name: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number | null

  @Column({ name: 'area_unit', type: 'varchar', length: 16, default: 'acres' })
  areaUnit: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  state: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  district: string | null

  @Column({ type: 'varchar', length: 128, nullable: true })
  crop: string | null

  @Column({ name: 'soil_type', type: 'varchar', length: 64, nullable: true })
  soilType: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  irrigation: string | null

  @Column({ name: 'sown_date', type: 'date', nullable: true })
  sownDate: string | null

  @Column({ name: 'expected_harvest', type: 'date', nullable: true })
  expectedHarvest: string | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null
}
