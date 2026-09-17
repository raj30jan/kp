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

/**
 * N-level hierarchical category for products and services.
 * Uses adjacency list (parent_id) + materialized path for efficient tree queries.
 * `level` starts at 0 for root categories. `path` is a slash-delimited materialized
 * path of ancestor IDs (e.g. "1/4/12") for fast subtree retrieval.
 */
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ name: 'parent_id', type: 'bigint', nullable: true })
  parentId: string | null

  @Index()
  @Column({ type: 'int', default: 0 })
  level: number

  @Index()
  @Column({ type: 'varchar', length: 500 })
  path: string

  @Column({ type: 'varchar', length: 128 })
  name: string

  @Column({ name: 'name_hi', type: 'varchar', length: 128, nullable: true })
  nameHi: string | null

  @Index()
  @Column({ type: 'varchar', length: 128 })
  slug: string

  /** 'category' (root) or 'subcategory' (has parent) */
  @Column({ type: 'varchar', length: 32, default: 'category' })
  type: string

  @Column({ name: 'is_leaf', type: 'tinyint', default: 0 })
  isLeaf: number

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number

  /** 1 = active, 0 = inactive — maps to status_master in the full schema */
  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number

  @Column({ name: 'status_id', type: 'bigint', default: 1 })
  statusId: number

  @Column({ name: 'icon', type: 'varchar', length: 255, nullable: true })
  icon: string | null

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'created_by', type: 'char', length: 36, nullable: true })
  createdBy: string | null

  @Column({ name: 'updated_by', type: 'char', length: 36, nullable: true })
  updatedBy: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null

  // --- Relations ---

  @ManyToOne(() => Category, (c) => c.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Category | null

  @OneToMany(() => Category, (c) => c.parent)
  children: Category[]
}
