import { DataSource, EntityManager } from 'typeorm'
import { SaleEntity } from '../entity/SaleEntity'
import { SaleDetailEntity } from '../entity/SaleDetailEntity'
import { ISale, ISaleDetail, ICustomerSummary } from '../domain/Sale'
import { toSale } from '../domain/mappers'

export interface ISaleRepository {
  getMaxSaleCode(): Promise<string | null>
  createSale(sale: ISale, details: ISaleDetail[]): Promise<ISale>
  findAll(): Promise<ISale[]>
  findByCustomer(customerId: string): Promise<ICustomerSummary>
}

export class SaleRepository implements ISaleRepository {
  private dataSource: DataSource

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource
  }

  async getMaxSaleCode(): Promise<string | null> {
    const result = await this.dataSource
      .getRepository(SaleEntity)
      .createQueryBuilder('sale')
      .select('MAX(sale.sale_code)', 'maxCode')
      .getRawOne()

    return result?.maxCode ?? null
  }

  async createSale(sale: ISale, details: ISaleDetail[]): Promise<ISale> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const saleEntity = manager.create(SaleEntity, {
        sale_code: sale.sale_code,
        customer_id: sale.customer_id,
        user_id: sale.user_id,
        total_sale: sale.total_sale,
        total_vat: sale.total_vat,
        total_with_vat: sale.total_with_vat,
      })
      await manager.save(SaleEntity, saleEntity)

      const detailEntities = details.map((d) =>
        manager.create(SaleDetailEntity, {
          sale_code: d.sale_code,
          product_code: d.product_code,
          product_name: d.product_name,
          quantity: d.quantity,
          unit_price: d.unit_price,
          vat_rate: d.vat_rate,
          line_total: d.line_total,
          line_vat: d.line_vat,
        })
      )
      await manager.save(SaleDetailEntity, detailEntities)

      const completeSale = await manager.findOneOrFail(SaleEntity, {
        where: { sale_code: sale.sale_code },
      })
      return toSale(completeSale)
    })
  }

  async findAll(): Promise<ISale[]> {
    const entities = await this.dataSource.getRepository(SaleEntity).find()
    return entities.map(toSale)
  }

  async findByCustomer(customerId: string): Promise<ICustomerSummary> {
    const result = await this.dataSource
      .getRepository(SaleEntity)
      .createQueryBuilder('sale')
      .select('sale.customer_id', 'customer_id')
      .addSelect('COALESCE(SUM(sale.total_with_vat), 0)', 'total_purchases')
      .addSelect('COUNT(sale.sale_code)', 'sale_count')
      .where('sale.customer_id = :customerId', { customerId })
      .groupBy('sale.customer_id')
      .getRawOne()

    if (!result) {
      return {
        customer_id: customerId,
        total_purchases: 0,
        sale_count: 0,
      }
    }

    return {
      customer_id: result.customer_id,
      total_purchases: parseFloat(result.total_purchases),
      sale_count: parseInt(result.sale_count, 10),
    }
  }
}
