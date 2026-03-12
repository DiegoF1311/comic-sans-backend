import { Request, Response } from 'express'
import Joi from 'joi'
import { ISaleRepository } from '../repository/sale.repository'
import { ISale, ISaleDetail } from '../domain/Sale'

const createSaleSchema = Joi.object({
  customer_id: Joi.string().required().messages({
    'any.required': 'Customer is required',
    'string.empty': 'Customer is required',
  }),
  details: Joi.array()
    .items(
      Joi.object({
        product_code: Joi.string().required(),
        product_name: Joi.string().required(),
        quantity: Joi.number().integer().required(),
        unit_price: Joi.number().required(),
        vat_rate: Joi.number().required(),
      })
    )
    .min(1)
    .max(3)
    .required()
    .messages({
      'array.min': 'Must include between 1 and 3 products',
      'array.max': 'Must include between 1 and 3 products',
    }),
})

export function generateSaleCode(maxCode: string | null): string {
  let nextNumber = 1
  if (maxCode) {
    const currentNumber = parseInt(maxCode.substring(1), 10)
    nextNumber = currentNumber + 1
  }
  return 'V' + nextNumber.toString().padStart(3, '0')
}

export function calculateLineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity
}

export function calculateLineVat(lineTotal: number, vatRate: number): number {
  return lineTotal * (vatRate / 100)
}

export class SaleHandler {
  private repository: ISaleRepository

  constructor(repository: ISaleRepository) {
    this.repository = repository
  }

  health = (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      data: { service: 'sales-service', status: 'ok' },
      error: null,
    })
  }

  createSale = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error: validationError, value: body } = createSaleSchema.validate(req.body, {
        abortEarly: true,
      })

      if (validationError) {
        res.status(400).json({ success: false, data: null, error: validationError.details[0].message })
        return
      }

      const maxCode = await this.repository.getMaxSaleCode()
      const saleCode = generateSaleCode(maxCode)
      const userId = req.headers['x-user-id'] as string

      let totalSale = 0
      let totalVat = 0

      const details: ISaleDetail[] = body.details.map((d: { product_code: string; product_name: string; quantity: number; unit_price: number; vat_rate: number }) => {
        const lineTotal = calculateLineTotal(d.unit_price, d.quantity)
        const lineVat = calculateLineVat(lineTotal, d.vat_rate)
        totalSale += lineTotal
        totalVat += lineVat

        return {
          sale_code: saleCode,
          product_code: d.product_code,
          product_name: d.product_name,
          quantity: d.quantity,
          unit_price: d.unit_price,
          vat_rate: d.vat_rate,
          line_total: lineTotal,
          line_vat: lineVat,
        }
      })

      const sale: ISale = {
        sale_code: saleCode,
        customer_id: body.customer_id,
        user_id: userId,
        total_sale: totalSale,
        total_vat: totalVat,
        total_with_vat: totalSale + totalVat,
        created_at: new Date(),
        details: [],
      }

      const savedSale = await this.repository.createSale(sale, details)

      res.status(201).json({ success: true, data: savedSale, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error creating sale' })
    }
  }

  listSales = async (_req: Request, res: Response): Promise<void> => {
    try {
      const sales = await this.repository.findAll()
      res.status(200).json({ success: true, data: sales, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error fetching sales' })
    }
  }

  getByCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId = req.params.customer_id
      const summary = await this.repository.findByCustomer(customerId)
      res.status(200).json({ success: true, data: summary, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error fetching customer sales' })
    }
  }
}
