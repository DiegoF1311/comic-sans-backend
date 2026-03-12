import { Request, Response } from 'express';
import { CustomerRepository } from '../repository/customer.repository';

export class CustomerHandler {
  private repository: CustomerRepository;

  constructor(repository: CustomerRepository) {
    this.repository = repository;
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { document_id, full_name, address, phone, email } = req.body;

      if (!document_id || !full_name || !address || !phone || !email) {
        res.status(400).json({ success: false, data: null, error: 'All fields are required' });
        return;
      }

      const existing = await this.repository.findByDocumentId(document_id);
      if (existing) {
        res.status(409).json({ success: false, data: null, error: 'A customer with that document ID already exists' });
        return;
      }

      const customer = await this.repository.create({ document_id, full_name, address, phone, email });
      res.status(201).json({ success: true, data: customer, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await this.repository.findByDocumentId(id);

      if (!customer) {
        res.status(404).json({ success: false, data: null, error: 'Customer not found' });
        return;
      }

      res.status(200).json({ success: true, data: customer, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' });
    }
  }

  async list(_req: Request, res: Response): Promise<void> {
    try {
      const customers = await this.repository.findAll();
      res.status(200).json({ success: true, data: customers, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { document_id, full_name, address, phone, email } = req.body;

      if (!document_id || !full_name || !address || !phone || !email) {
        res.status(400).json({ success: false, data: null, error: 'All fields are required' });
        return;
      }

      const existing = await this.repository.findByDocumentId(document_id);
      if (!existing) {
        res.status(404).json({ success: false, data: null, error: 'Customer not found' });
        return;
      }

      const updated = await this.repository.update(document_id, { full_name, address, phone, email });
      res.status(200).json({ success: true, data: updated, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await this.repository.findByDocumentId(id);

      if (!existing) {
        res.status(404).json({ success: false, data: null, error: 'Customer not found' });
        return;
      }

      await this.repository.delete(id);
      res.status(204).json({ success: true, data: null, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' });
    }
  }
}
