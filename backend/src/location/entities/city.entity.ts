import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { District } from './district.entity'

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ name: 'district_id', type: 'bigint' })
  districtId: string

  @Column({ type: 'varchar', length: 128 })
  name: string

  @Column({ name: 'status_id', type: 'bigint' })
  statusId: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null

  @ManyToOne(() => District, (d) => d.cities)
  @JoinColumn({ name: 'district_id' })
  district: District
}
