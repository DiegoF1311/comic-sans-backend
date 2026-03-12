import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customers')
export class CustomerEntity {
  @PrimaryColumn({ name: 'document_id', type: 'varchar', length: 20 })
  document_id!: string;

  @Column({ type: 'varchar', length: 100 })
  full_name!: string;

  @Column({ type: 'varchar', length: 200 })
  address!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 100 })
  email!: string;

  @CreateDateColumn()
  created_at!: Date;
}
