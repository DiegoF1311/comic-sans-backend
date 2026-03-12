import { Router } from 'express'
import { ReportHandler } from '../handler/report.handler'

export function createReportRoutes(handler: ReportHandler): Router {
  const router = Router()

  router.get('/health', handler.health)
  router.get('/users/list', handler.getUsersList)
  router.get('/customers/list', handler.getCustomersList)
  router.get('/reports/sales-by-customer', handler.getSalesByCustomer)

  return router
}
