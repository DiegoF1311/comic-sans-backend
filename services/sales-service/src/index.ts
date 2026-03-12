import 'reflect-metadata'
import 'dotenv/config'
import express from 'express'
import { AppDataSource } from './database'
import { SaleRepository } from './repository/sale.repository'
import { SaleHandler } from './handler/sale.handler'
import { createSaleRoutes } from './routes/sale.routes'
import { internalMiddleware } from './middleware/internal.middleware'

const app = express()
const PORT = process.env.PORT || 3005

app.use(express.json())
app.use(internalMiddleware)

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected')

    const repository = new SaleRepository(AppDataSource)
    const handler = new SaleHandler(repository)
    const routes = createSaleRoutes(handler)

    app.use(routes)

    app.listen(PORT, () => {
      console.log(`sales-service running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Database connection failed:', error)
    process.exit(1)
  })
