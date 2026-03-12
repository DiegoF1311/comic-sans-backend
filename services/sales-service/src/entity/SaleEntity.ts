import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm'
import { SaleDetailEntity } from './SaleDetailEntity'

@Entity('sales')
export class SaleEntity {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  sale_code!: string

  @Column({ type: 'varchar', length: 20 })
  customer_id!: string

  @Column({ type: 'varchar', length: 20 })
  user_id!: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_sale!: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_vat!: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_with_vat!: number

  @CreateDateColumn()
  created_at!: Date

  @OneToMany(() => SaleDetailEntity, (detail) => detail.sale, { cascade: true, eager: true })
  details!: SaleDetailEntity[]
}
