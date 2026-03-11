import { Repository } from 'typeorm';
import { CustomerEntity } from '../entity/CustomerEntity';
import { AppDataSource } from '../database';
import { ICustomer, CreateCustomerDto } from '../domain/Customer';

export class CustomerRepository {
  private repo: Repository<CustomerEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(CustomerEntity);
  }

  async findByCedula(cedula: string): Promise<ICustomer | null> {
    return this.repo.findOneBy({ cedula });
  }

  async findAll(): Promise<ICustomer[]> {
    return this.repo.find();
  }

  async create(data: CreateCustomerDto): Promise<ICustomer> {
    const customer = this.repo.create(data);
    return this.repo.save(customer);
  }

  async update(cedula: string, data: Omit<CreateCustomerDto, 'cedula'>): Promise<ICustomer> {
    await this.repo.update(cedula, data);
    return (await this.repo.findOneBy({ cedula }))!;
  }

  async delete(cedula: string): Promise<void> {
    await this.repo.delete(cedula);
  }
}
