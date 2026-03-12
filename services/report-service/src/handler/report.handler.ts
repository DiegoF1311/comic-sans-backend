import { Request, Response } from 'express'
import { IReportRepository } from '../repository/report.repository'
import { ISalesByCustomerReport } from '../domain/Report'

export class ReportHandler {
  private repository: IReportRepository

  constructor(repository: IReportRepository) {
    this.repository = repository
  }

  health = (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      data: { service: 'report-service', status: 'ok' },
      error: null,
    })
  }

  getUsersList = async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.repository.fetchUsers()
      res.status(200).json({ success: true, data: users, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error fetching users' })
    }
  }

  getCustomersList = async (_req: Request, res: Response): Promise<void> => {
    try {
      const customers = await this.repository.fetchCustomers()
      res.status(200).json({ success: true, data: customers, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error fetching customers' })
    }
  }

  getSalesByCustomer = async (_req: Request, res: Response): Promise<void> => {
    try {
      const customers = await this.repository.fetchCustomers()

      const summaries = await Promise.all(
        customers.map((customer) => this.repository.fetchSalesByCustomer(customer.document_id))
      )

      const report: ISalesByCustomerReport[] = customers
        .map((customer, index) => ({
          customer_id: customer.document_id,
          full_name: customer.full_name,
          total_purchases: summaries[index].total_purchases,
        }))
        .filter((entry) => entry.total_purchases > 0)

      res.status(200).json({ success: true, data: report, error: null })
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Error generating sales by customer report' })
    }
  }
}
