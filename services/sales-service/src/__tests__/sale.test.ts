import { Request, Response } from 'express'
import { SaleHandler, generateSaleCode, calculateLineTotal, calculateLineVat } from '../handler/sale.handler'
import { ISaleRepository } from '../repository/sale.repository'
import { ISale, ICustomerSummary } from '../domain/Sale'

function mockResponse(): Response {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res as Response
}

function mockRepository(): jest.Mocked<ISaleRepository> {
  return {
    getMaxSaleCode: jest.fn(),
    createSale: jest.fn(),
    findAll: jest.fn(),
    findByCustomer: jest.fn(),
  }
}

describe('sales-service', () => {
  let repo: jest.Mocked<ISaleRepository>
  let handler: SaleHandler
  let res: Response

  beforeEach(() => {
    repo = mockRepository()
    handler = new SaleHandler(repo)
    res = mockResponse()
  })

  describe('calculateLineTotal_correct', () => {
    test('should calculate line_total = unit_price * quantity and line_vat correctly', () => {
      const lineTotal = calculateLineTotal(4000, 3)
      expect(lineTotal).toBe(12000)

      const lineVat = calculateLineVat(lineTotal, 19)
      expect(lineVat).toBe(2280)
    })
  })

  describe('calculateSaleTotal_correct', () => {
    test('should sum line totals and VATs for multiple details', () => {
      const line1Total = calculateLineTotal(4000, 2)
      const line1Vat = calculateLineVat(line1Total, 19)
      const line2Total = calculateLineTotal(3000, 3)
      const line2Vat = calculateLineVat(line2Total, 19)

      const totalSale = line1Total + line2Total
      const totalVat = line1Vat + line2Vat
      const totalWithVat = totalSale + totalVat

      expect(line1Total).toBe(8000)
      expect(line2Total).toBe(9000)
      expect(totalSale).toBe(17000)
      expect(totalVat).toBe(3230)
      expect(totalWithVat).toBe(20230)
    })
  })

  describe('generateSaleCode_consecutive', () => {
    test('should generate V001 when no previous sales exist', () => {
      expect(generateSaleCode(null)).toBe('V001')
    })

    test('should generate V002 when max code is V001', () => {
      expect(generateSaleCode('V001')).toBe('V002')
    })

    test('should generate V010 when max code is V009', () => {
      expect(generateSaleCode('V009')).toBe('V010')
    })
  })

  describe('createSale_success', () => {
    test('should return 201 with the saved sale', async () => {
      repo.getMaxSaleCode.mockResolvedValue(null)

      const savedSale: ISale = {
        sale_code: 'V001',
        customer_id: '11111111',
        user_id: '12345678',
        total_sale: 8000,
        total_vat: 1520,
        total_with_vat: 9520,
        created_at: new Date(),
        details: [],
      }
      repo.createSale.mockResolvedValue(savedSale)

      const req = {
        body: {
          customer_id: '11111111',
          details: [
            {
              product_code: '1001',
              product_name: 'Manzanas Rojas',
              quantity: 2,
              unit_price: 4000,
              vat_rate: 19,
            },
          ],
        },
        headers: { 'x-user-id': '12345678' },
      } as unknown as Request

      await handler.createSale(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: savedSale,
        error: null,
      })
      expect(repo.createSale).toHaveBeenCalled()
    })
  })

  describe('createSale_noProducts', () => {
    test('should return 400 when details is empty', async () => {
      const req = {
        body: { customer_id: '11111111', details: [] },
        headers: { 'x-user-id': '12345678' },
      } as unknown as Request

      await handler.createSale(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: 'Must include between 1 and 3 products',
      })
    })
  })

  describe('createSale_noCustomer', () => {
    test('should return 400 when customer_id is missing', async () => {
      const req = {
        body: {
          details: [
            {
              product_code: '1001',
              product_name: 'Manzanas',
              quantity: 1,
              unit_price: 1000,
              vat_rate: 19,
            },
          ],
        },
        headers: { 'x-user-id': '12345678' },
      } as unknown as Request

      await handler.createSale(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: 'Customer is required',
      })
    })
  })

  describe('getSalesByCustomer_withSales', () => {
    test('should return customer summary with totals', async () => {
      const summary: ICustomerSummary = {
        customer_id: '11111111',
        total_purchases: 45000,
        sale_count: 3,
      }
      repo.findByCustomer.mockResolvedValue(summary)

      const req = {
        params: { customer_id: '11111111' },
        headers: {},
      } as unknown as Request

      await handler.getByCustomer(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: summary,
        error: null,
      })
    })
  })

  describe('getSalesByCustomer_noSales', () => {
    test('should return zero totals when customer has no sales', async () => {
      const summary: ICustomerSummary = {
        customer_id: '99999999',
        total_purchases: 0,
        sale_count: 0,
      }
      repo.findByCustomer.mockResolvedValue(summary)

      const req = {
        params: { customer_id: '99999999' },
        headers: {},
      } as unknown as Request

      await handler.getByCustomer(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: summary,
        error: null,
      })
    })
  })
})
