import { Request, Response } from 'express';
import { CustomerRepository } from '../repository/customer.repository';

export class CustomerHandler {
  private repository: CustomerRepository;

  constructor(repository: CustomerRepository) {
    this.repository = repository;
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { cedula, full_name, address, phone, email } = req.body;

      if (!cedula || !full_name || !address || !phone || !email) {
        res.status(400).json({ success: false, data: null, error: 'Todos los campos son requeridos' });
        return;
      }

      const existing = await this.repository.findByCedula(cedula);
      if (existing) {
        res.status(409).json({ success: false, data: null, error: 'Ya existe un cliente con esa cédula' });
        return;
      }

      const customer = await this.repository.create({ cedula, full_name, address, phone, email });
      res.status(201).json({ success: true, data: customer, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error interno del servidor' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await this.repository.findByCedula(id);

      if (!customer) {
        res.status(404).json({ success: false, data: null, error: 'Cliente no encontrado' });
        return;
      }

      res.status(200).json({ success: true, data: customer, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error interno del servidor' });
    }
  }

  async list(_req: Request, res: Response): Promise<void> {
    try {
      const customers = await this.repository.findAll();
      res.status(200).json({ success: true, data: customers, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error interno del servidor' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { cedula, full_name, address, phone, email } = req.body;

      if (!cedula || !full_name || !address || !phone || !email) {
        res.status(400).json({ success: false, data: null, error: 'Todos los campos son requeridos' });
        return;
      }

      const existing = await this.repository.findByCedula(cedula);
      if (!existing) {
        res.status(404).json({ success: false, data: null, error: 'Cliente no encontrado' });
        return;
      }

      const updated = await this.repository.update(cedula, { full_name, address, phone, email });
      res.status(200).json({ success: true, data: updated, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error interno del servidor' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await this.repository.findByCedula(id);

      if (!existing) {
        res.status(404).json({ success: false, data: null, error: 'Cliente no encontrado' });
        return;
      }

      await this.repository.delete(id);
      res.status(204).json({ success: true, data: null, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error interno del servidor' });
    }
  }
}
