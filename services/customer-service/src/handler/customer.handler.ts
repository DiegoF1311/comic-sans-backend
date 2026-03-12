import { Request, Response } from 'express'
import Joi from 'joi'
import { ICustomerRepository } from '../repository/customer.repository'

const createCustomerSchema = Joi.object({
  document_id: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
  full_name: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
  address: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
  phone: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
  email: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
})

const updateCustomerSchema = Joi.object({
  document_id: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
  full_name: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
  address: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
  phone: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
  email: Joi.string().required().messages({
    'any.required': 'All fields are required',
    'string.empty': 'All fields are required',
  }),
})

export class CustomerHandler {
  private repository: ICustomerRepository

  constructor(repository: ICustomerRepository) {
    this.repository = repository
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { error: validationError, value: body } = createCustomerSchema.validate(req.body, { abortEarly: true })
      if (validationError) {
        res.status(400).json({ success: false, data: null, error: validationError.details[0].message })
        return
      }

      const existing = await this.repository.findByDocumentId(body.document_id)
      if (existing) {
        res.status(409).json({ success: false, data: null, error: 'A customer with that document ID already exists' })
        return
      }

      const customer = await this.repository.create(body)
      res.status(201).json({ success: true, data: customer, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' })
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const customer = await this.repository.findByDocumentId(id)

      if (!customer) {
        res.status(404).json({ success: false, data: null, error: 'Customer not found' })
        return
      }

      res.status(200).json({ success: true, data: customer, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' })
    }
  }

  async list(_req: Request, res: Response): Promise<void> {
    try {
      const customers = await this.repository.findAll()
      res.status(200).json({ success: true, data: customers, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' })
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { error: validationError, value: body } = updateCustomerSchema.validate(req.body, { abortEarly: true })
      if (validationError) {
        res.status(400).json({ success: false, data: null, error: validationError.details[0].message })
        return
      }

      const existing = await this.repository.findByDocumentId(body.document_id)
      if (!existing) {
        res.status(404).json({ success: false, data: null, error: 'Customer not found' })
        return
      }

      const { document_id, ...updateData } = body
      const updated = await this.repository.update(document_id, updateData)
      res.status(200).json({ success: true, data: updated, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' })
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const existing = await this.repository.findByDocumentId(id)

      if (!existing) {
        res.status(404).json({ success: false, data: null, error: 'Customer not found' })
        return
      }

      await this.repository.delete(id)
      res.status(204).json({ success: true, data: null, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Internal server error' })
    }
  }
}
