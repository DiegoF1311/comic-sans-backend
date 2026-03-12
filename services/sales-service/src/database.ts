import { DataSource } from 'typeorm'
import { SaleEntity } from './entity/SaleEntity'
import { SaleDetailEntity } from './entity/SaleDetailEntity'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [SaleEntity, SaleDetailEntity],
  synchronize: true,
  logging: false,
})
