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
import { Country } from './country.entity'
import { District } from './district.entity'

@Entity('states')
export class State {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ name: 'country_id', type: 'bigint' })
  countryId: string

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

  @ManyToOne(() => Country, (c) => c.states)
  @JoinColumn({ name: 'country_id' })
  country: Country

  @OneToMany(() => District, (d) => d.state)
  districts: District[]
}
