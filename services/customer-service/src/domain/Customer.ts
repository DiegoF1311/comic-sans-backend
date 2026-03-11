export interface ICustomer {
  cedula: string;
  full_name: string;
  address: string;
  phone: string;
  email: string;
  created_at: Date;
}

export interface CreateCustomerDto {
  cedula: string;
  full_name: string;
  address: string;
  phone: string;
  email: string;
}
