import { Request, Response, NextFunction } from 'express';

export function requireInternal(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-internal'] !== 'true') {
    return res.status(401).json({ success: false, data: null, error: 'Unauthorized access' });
  }
  next();
}
