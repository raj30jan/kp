import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { State } from './state.entity'

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ type: 'varchar', length: 128 })
  name: string

  @Column({ name: 'iso_code_2', type: 'char', length: 2 })
  isoCode2: string

  @Column({ name: 'iso_code_3', type: 'char', length: 3, nullable: true })
  isoCode3: string | null

  @Column({ name: 'phone_code', type: 'varchar', length: 8, nullable: true })
  phoneCode: string | null

  @Column({ name: 'currency_code', type: 'char', length: 3, nullable: true })
  currencyCode: string | null

  @Column({ name: 'status_id', type: 'bigint' })
  statusId: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null

  @OneToMany(() => State, (s) => s.country)
  states: State[]
}
