import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

/**
 * Maps to the `users` table created by database/schema.sql.
 * UUID primary key, soft delete via deleted_at, audit columns.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 128, nullable: true })
  email: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile: string | null

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null

  @Column({ name: 'display_name', type: 'varchar', length: 128, nullable: true })
  displayName: string | null

  @Column({ name: 'status_id', type: 'bigint' })
  statusId: number

  @Column({ name: 'is_verified', type: 'tinyint', default: 0 })
  isVerified: number

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number

  // user | admin | super_admin — drives RBAC guards + dashboard routing
  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string

  // Lifetime free-tier usage counters (5-product cap). Never decremented,
  // even if a listing is later deleted, so the cap can't be reset by
  // delete+recreate (paired with unique mobile/email at registration).
  @Column({ name: 'free_listings_used', type: 'int', default: 0 })
  freeListingsUsed: number

  @Column({ name: 'free_contacts_used', type: 'int', default: 0 })
  freeContactsUsed: number

  @Column({ name: 'mobile_verified_at', type: 'timestamp', nullable: true })
  mobileVerifiedAt: Date | null

  @Column({ name: 'created_by', type: 'char', length: 36, nullable: true })
  createdBy: string | null

  @Column({ name: 'updated_by', type: 'char', length: 36, nullable: true })
  updatedBy: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null
}
