import { ISale, ISaleDetail } from './Sale'
import { SaleEntity } from '../entity/SaleEntity'
import { SaleDetailEntity } from '../entity/SaleDetailEntity'

export function toSaleDetail(entity: SaleDetailEntity): ISaleDetail {
  return {
    id: entity.id,
    sale_code: entity.sale_code,
    product_code: entity.product_code,
    product_name: entity.product_name,
    quantity: entity.quantity,
    unit_price: entity.unit_price,
    vat_rate: entity.vat_rate,
    line_total: entity.line_total,
    line_vat: entity.line_vat,
  }
}

export function toSale(entity: SaleEntity): ISale {
  return {
    sale_code: entity.sale_code,
    customer_id: entity.customer_id,
    user_id: entity.user_id,
    total_sale: entity.total_sale,
    total_vat: entity.total_vat,
    total_with_vat: entity.total_with_vat,
    created_at: entity.created_at,
    details: (entity.details ?? []).map(toSaleDetail),
  }
}
