import { AxiosInstance } from 'axios'
import { IUserReport, ICustomerReport, ICustomerSummary } from '../domain/Report'

export interface IReportRepository {
  fetchUsers(): Promise<IUserReport[]>
  fetchCustomers(): Promise<ICustomerReport[]>
  fetchSalesByCustomer(customerId: string): Promise<ICustomerSummary>
}

export class ReportRepository implements IReportRepository {
  private client: AxiosInstance
  private userServiceUrl: string
  private customerServiceUrl: string
  private salesServiceUrl: string

  constructor(
    client: AxiosInstance,
    userServiceUrl: string,
    customerServiceUrl: string,
    salesServiceUrl: string
  ) {
    this.client = client
    this.userServiceUrl = userServiceUrl
    this.customerServiceUrl = customerServiceUrl
    this.salesServiceUrl = salesServiceUrl
  }

  async fetchUsers(): Promise<IUserReport[]> {
    const response = await this.client.get(`${this.userServiceUrl}/users/list`)
    return response.data.data
  }

  async fetchCustomers(): Promise<ICustomerReport[]> {
    const response = await this.client.get(`${this.customerServiceUrl}/customers/list`)
    return response.data.data
  }

  async fetchSalesByCustomer(customerId: string): Promise<ICustomerSummary> {
    const response = await this.client.get(`${this.salesServiceUrl}/sales/by-customer/${customerId}`)
    return response.data.data
  }
}
