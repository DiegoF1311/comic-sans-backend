import { Router } from 'express'
import { SaleHandler } from '../handler/sale.handler'

export function createSaleRoutes(handler: SaleHandler): Router {
  const router = Router()

  router.get('/health', handler.health)
  router.post('/sales/save', handler.createSale)
  router.get('/sales/list', handler.listSales)
  router.get('/sales/by-customer/:customer_id', handler.getByCustomer)

  return router
}
