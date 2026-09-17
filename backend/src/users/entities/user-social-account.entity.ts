import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

/**
 * Maps to the `user_social_accounts` table (see database/schema.sql).
 * Links a local user to a social-login provider identity (Google, Facebook, ...).
 */
@Entity('user_social_accounts')
export class UserSocialAccount {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId: string

  @Column({ type: 'varchar', length: 64 })
  provider: string

  @Column({ name: 'provider_user_id', type: 'varchar', length: 255 })
  providerUserId: string

  @Column({ name: 'access_token', type: 'varchar', length: 512, nullable: true })
  accessToken: string | null

  @Column({ name: 'refresh_token', type: 'varchar', length: 512, nullable: true })
  refreshToken: string | null

  @Column({ name: 'status_id', type: 'bigint' })
  statusId: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null
}
