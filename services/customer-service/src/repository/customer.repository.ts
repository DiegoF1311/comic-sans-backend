import { Repository } from 'typeorm';
import { CustomerEntity } from '../entity/CustomerEntity';
import { AppDataSource } from '../database';
import { ICustomer, CreateCustomerDto } from '../domain/Customer';

export class CustomerRepository {
  private repo: Repository<CustomerEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(CustomerEntity);
  }

  async findByDocumentId(documentId: string): Promise<ICustomer | null> {
    return this.repo.findOneBy({ document_id: documentId });
  }

  async findAll(): Promise<ICustomer[]> {
    return this.repo.find();
  }

  async create(data: CreateCustomerDto): Promise<ICustomer> {
    const customer = this.repo.create(data);
    return this.repo.save(customer);
  }

  async update(documentId: string, data: Omit<CreateCustomerDto, 'document_id'>): Promise<ICustomer> {
    await this.repo.update(documentId, data);
    return (await this.repo.findOneBy({ document_id: documentId }))!;
  }

  async delete(documentId: string): Promise<void> {
    await this.repo.delete(documentId);
  }
}
