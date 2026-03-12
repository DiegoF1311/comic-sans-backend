export interface ISaleDetail {
  id?: number
  sale_code: string
  product_code: string
  product_name: string
  quantity: number
  unit_price: number
  vat_rate: number
  line_total: number
  line_vat: number
}

export interface ISale {
  sale_code: string
  customer_id: string
  user_id: string
  total_sale: number
  total_vat: number
  total_with_vat: number
  created_at: Date
  details: ISaleDetail[]
}

export interface CreateSaleDetailDTO {
  product_code: string
  product_name: string
  quantity: number
  unit_price: number
  vat_rate: number
}

export interface CreateSaleDTO {
  customer_id: string
  details: CreateSaleDetailDTO[]
}

export interface ICustomerSummary {
  customer_id: string
  total_purchases: number
  sale_count: number
}
