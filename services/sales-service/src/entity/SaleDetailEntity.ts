import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { SaleEntity } from './SaleEntity'

@Entity('sale_details')
export class SaleDetailEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 20 })
  sale_code!: string

  @Column({ type: 'varchar', length: 20 })
  product_code!: string

  @Column({ type: 'varchar', length: 100 })
  product_name!: string

  @Column({ type: 'int' })
  quantity!: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price!: number

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  vat_rate!: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  line_total!: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  line_vat!: number

  @ManyToOne(() => SaleEntity, (sale) => sale.details)
  @JoinColumn({ name: 'sale_code' })
  sale!: SaleEntity
}
