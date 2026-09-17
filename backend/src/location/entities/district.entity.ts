import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { State } from './state.entity'
import { City } from './city.entity'

@Entity('districts')
export class District {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ name: 'state_id', type: 'bigint' })
  stateId: string

  @Column({ type: 'varchar', length: 128 })
  name: string

  @Column({ type: 'varchar', length: 16, nullable: true })
  code: string | null

  @Column({ name: 'status_id', type: 'bigint' })
  statusId: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null

  @ManyToOne(() => State, (s) => s.districts)
  @JoinColumn({ name: 'state_id' })
  state: State

  @OneToMany(() => City, (c) => c.district)
  cities: City[]
}
