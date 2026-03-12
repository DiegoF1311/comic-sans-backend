import { Request, Response } from 'express'
import { ReportHandler } from '../handler/report.handler'
import { IReportRepository } from '../repository/report.repository'
import { IUserReport, ICustomerReport, ICustomerSummary } from '../domain/Report'

function mockResponse(): Response {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res as Response
}

function mockRepository(): jest.Mocked<IReportRepository> {
  return {
    fetchUsers: jest.fn(),
    fetchCustomers: jest.fn(),
    fetchSalesByCustomer: jest.fn(),
  }
}

describe('ReportHandler', () => {
  let repo: jest.Mocked<IReportRepository>
  let handler: ReportHandler
  let res: Response

  beforeEach(() => {
    repo = mockRepository()
    handler = new ReportHandler(repo)
    res = mockResponse()
  })

  const sampleUsers: IUserReport[] = [
    { cedula: '12345678', username: 'jperez', full_name: 'Juan Perez', is_active: true },
    { cedula: '87654321', username: 'mlopez', full_name: 'Mary Lopez', is_active: true },
  ]

  const sampleCustomers: ICustomerReport[] = [
    {
      document_id: '11111111',
      full_name: 'Mary Lopez',
      address: '123 Main St',
      phone: '3001234567',
      email: 'mary@mail.com',
      created_at: '2024-01-01T00:00:00.000Z',
    },
    {
      document_id: '22222222',
      full_name: 'Carlos Ruiz',
      address: '456 Oak Ave',
      phone: '3009876543',
      email: 'carlos@mail.com',
      created_at: '2024-01-02T00:00:00.000Z',
    },
  ]

  // SP5-QA-01
  test('getUsersReport_withData', async () => {
    repo.fetchUsers.mockResolvedValue(sampleUsers)

    const req = {} as Request

    await handler.getUsersList(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: sampleUsers,
      error: null,
    })
  })

  // SP5-QA-02
  test('getCustomersReport_withData', async () => {
    repo.fetchCustomers.mockResolvedValue(sampleCustomers)

    const req = {} as Request

    await handler.getCustomersList(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: sampleCustomers,
      error: null,
    })
  })

  // SP5-QA-03
  test('getSalesByCustomerReport_withData', async () => {
    repo.fetchCustomers.mockResolvedValue(sampleCustomers)

    const summary1: ICustomerSummary = { customer_id: '11111111', total_purchases: 45000, sale_count: 3 }
    const summary2: ICustomerSummary = { customer_id: '22222222', total_purchases: 12000, sale_count: 1 }

    repo.fetchSalesByCustomer
      .mockResolvedValueOnce(summary1)
      .mockResolvedValueOnce(summary2)

    const req = {} as Request

    await handler.getSalesByCustomer(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        { customer_id: '11111111', full_name: 'Mary Lopez', total_purchases: 45000 },
        { customer_id: '22222222', full_name: 'Carlos Ruiz', total_purchases: 12000 },
      ],
      error: null,
    })
  })

  test('getSalesByCustomerReport_empty', async () => {
    repo.fetchCustomers.mockResolvedValue(sampleCustomers)

    const emptySummary1: ICustomerSummary = { customer_id: '11111111', total_purchases: 0, sale_count: 0 }
    const emptySummary2: ICustomerSummary = { customer_id: '22222222', total_purchases: 0, sale_count: 0 }

    repo.fetchSalesByCustomer
      .mockResolvedValueOnce(emptySummary1)
      .mockResolvedValueOnce(emptySummary2)

    const req = {} as Request

    await handler.getSalesByCustomer(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
      error: null,
    })
  })

  test('getSalesByCustomerReport_parallel', async () => {
    repo.fetchCustomers.mockResolvedValue(sampleCustomers)

    const summary1: ICustomerSummary = { customer_id: '11111111', total_purchases: 45000, sale_count: 3 }
    const summary2: ICustomerSummary = { customer_id: '22222222', total_purchases: 12000, sale_count: 1 }

    repo.fetchSalesByCustomer
      .mockResolvedValueOnce(summary1)
      .mockResolvedValueOnce(summary2)

    const req = {} as Request

    await handler.getSalesByCustomer(req, res)

    expect(repo.fetchSalesByCustomer).toHaveBeenCalledTimes(2)
    expect(repo.fetchSalesByCustomer).toHaveBeenCalledWith('11111111')
    expect(repo.fetchSalesByCustomer).toHaveBeenCalledWith('22222222')
  })
})
