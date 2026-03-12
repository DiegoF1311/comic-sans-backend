export interface IUserReport {
  cedula: string
  username: string
  full_name: string
  is_active: boolean
}

export interface ICustomerReport {
  document_id: string
  full_name: string
  address: string
  phone: string
  email: string
  created_at: string
}

export interface ICustomerSummary {
  customer_id: string
  total_purchases: number
  sale_count: number
}

export interface ISalesByCustomerReport {
  customer_id: string
  full_name: string
  total_purchases: number
  sale_count: number
}
