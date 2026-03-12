import 'dotenv/config'
import express from 'express'
import { serviceClient } from './http/serviceClient'
import { ReportRepository } from './repository/report.repository'
import { ReportHandler } from './handler/report.handler'
import { createReportRoutes } from './routes/report.routes'
import { internalMiddleware } from './middleware/internal.middleware'

const app = express()
const PORT = process.env.PORT || 3006

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002'
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3004'
const SALES_SERVICE_URL = process.env.SALES_SERVICE_URL || 'http://localhost:3005'

app.use(express.json())
app.use(internalMiddleware)

const repository = new ReportRepository(serviceClient, USER_SERVICE_URL, CUSTOMER_SERVICE_URL, SALES_SERVICE_URL)
const handler = new ReportHandler(repository)
const routes = createReportRoutes(handler)

app.use(routes)

app.listen(PORT, () => {
  console.log(`report-service running on port ${PORT}`)
})

export default app
