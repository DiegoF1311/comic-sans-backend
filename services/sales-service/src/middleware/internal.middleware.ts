import { Request, Response, NextFunction } from 'express'

export function internalMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.headers['x-internal'] !== 'true') {
    res.status(401).json({ success: false, data: null, error: 'Unauthorized' })
    return
  }
  next()
}
