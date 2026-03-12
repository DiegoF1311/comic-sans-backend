import { Router } from 'express';
import { CustomerHandler } from '../handler/customer.handler';
import { requireInternal } from '../middleware/internal.middleware';

export function customerRoutes(handler: CustomerHandler): Router {
  const router = Router();

  router.use(requireInternal);

  router.post('/customers/save', (req, res) => handler.create(req, res));
  router.get('/customers/list', (req, res) => handler.list(req, res));
  router.get('/customers/:id', (req, res) => handler.getById(req, res));
  router.put('/customers/update', (req, res) => handler.update(req, res));
  router.delete('/customers/delete/:id', (req, res) => handler.delete(req, res));

  return router;
}
