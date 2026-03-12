import { ICustomer } from './Customer'
import { CustomerEntity } from '../entity/CustomerEntity'

export function toCustomer(entity: CustomerEntity): ICustomer {
  return {
    document_id: entity.document_id,
    full_name: entity.full_name,
    address: entity.address,
    phone: entity.phone,
    email: entity.email,
    created_at: entity.created_at,
  }
}
