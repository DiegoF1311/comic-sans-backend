export interface ICustomer {
  document_id: string;
  full_name: string;
  address: string;
  phone: string;
  email: string;
  created_at: Date;
}

export interface CreateCustomerDto {
  document_id: string;
  full_name: string;
  address: string;
  phone: string;
  email: string;
}
