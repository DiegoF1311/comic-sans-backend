import { DataSource } from 'typeorm'
import { CustomerEntity } from '../entity/CustomerEntity'
import { ICustomer, CreateCustomerDto } from '../domain/Customer'
import { toCustomer } from '../domain/mappers'

export interface ICustomerRepository {
  findByDocumentId(documentId: string): Promise<ICustomer | null>
  findAll(): Promise<ICustomer[]>
  create(data: CreateCustomerDto): Promise<ICustomer>
  update(documentId: string, data: Omit<CreateCustomerDto, 'document_id'>): Promise<ICustomer>
  delete(documentId: string): Promise<void>
}

export class CustomerRepository implements ICustomerRepository {
  private dataSource: DataSource

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource
  }

  async findByDocumentId(documentId: string): Promise<ICustomer | null> {
    const entity = await this.dataSource.getRepository(CustomerEntity).findOneBy({ document_id: documentId })
    return entity ? toCustomer(entity) : null
  }

  async findAll(): Promise<ICustomer[]> {
    const entities = await this.dataSource.getRepository(CustomerEntity).find()
    return entities.map(toCustomer)
  }

  async create(data: CreateCustomerDto): Promise<ICustomer> {
    const repo = this.dataSource.getRepository(CustomerEntity)
    const entity = repo.create(data)
    const saved = await repo.save(entity)
    return toCustomer(saved)
  }

  async update(documentId: string, data: Omit<CreateCustomerDto, 'document_id'>): Promise<ICustomer> {
    const repo = this.dataSource.getRepository(CustomerEntity)
    await repo.update(documentId, data)
    const updated = await repo.findOneByOrFail({ document_id: documentId })
    return toCustomer(updated)
  }

  async delete(documentId: string): Promise<void> {
    await this.dataSource.getRepository(CustomerEntity).delete(documentId)
  }
}
