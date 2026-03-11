import { Request, Response } from 'express';
import { CustomerHandler } from '../src/handler/customer.handler';
import { CustomerRepository } from '../src/repository/customer.repository';

jest.mock('../src/repository/customer.repository');

function mockRequest(body: any = {}, params: any = {}): Partial<Request> {
  return { body, params };
}

function mockResponse(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('CustomerHandler', () => {
  let handler: CustomerHandler;
  let repository: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    repository = new CustomerRepository() as jest.Mocked<CustomerRepository>;
    handler = new CustomerHandler(repository);
  });

  const sampleCustomer = {
    cedula: '11111111',
    full_name: 'María López',
    address: 'Calle 1 #2-3',
    phone: '3001234567',
    email: 'maria@mail.com',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
  };

  // SP2-QA-01
  test('createCustomer_success', async () => {
    repository.findByCedula.mockResolvedValue(null);
    repository.create.mockResolvedValue(sampleCustomer as any);

    const req = mockRequest({
      cedula: '11111111',
      full_name: 'María López',
      address: 'Calle 1 #2-3',
      phone: '3001234567',
      email: 'maria@mail.com',
    });
    const res = mockResponse();

    await handler.create(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: sampleCustomer, error: null });
  });

  // SP2-QA-02
  test('createCustomer_missingFields', async () => {
    const req = mockRequest({ cedula: '11111111' });
    const res = mockResponse();

    await handler.create(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: 'Todos los campos son requeridos',
    });
  });

  // SP2-QA-03 / SP4-QA-01
  test('getCustomer_found', async () => {
    repository.findByCedula.mockResolvedValue(sampleCustomer as any);

    const req = mockRequest({}, { id: '11111111' });
    const res = mockResponse();

    await handler.getById(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: sampleCustomer, error: null });
  });

  // SP2-QA-04 / SP4-QA-02
  test('getCustomer_notFound', async () => {
    repository.findByCedula.mockResolvedValue(null);

    const req = mockRequest({}, { id: '99999999' });
    const res = mockResponse();

    await handler.getById(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: 'Cliente no encontrado',
    });
  });

  // SP2-QA-05
  test('updateCustomer_success', async () => {
    const updatedCustomer = { ...sampleCustomer, full_name: 'María López Actualizada' };
    repository.findByCedula.mockResolvedValue(sampleCustomer as any);
    repository.update.mockResolvedValue(updatedCustomer as any);

    const req = mockRequest({
      cedula: '11111111',
      full_name: 'María López Actualizada',
      address: 'Calle 1 #2-3',
      phone: '3001234567',
      email: 'maria@mail.com',
    });
    const res = mockResponse();

    await handler.update(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedCustomer, error: null });
  });

  // SP2-QA-06
  test('updateCustomer_missingFields', async () => {
    const req = mockRequest({ cedula: '11111111' });
    const res = mockResponse();

    await handler.update(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: 'Todos los campos son requeridos',
    });
  });

  // SP2-QA-07
  test('deleteCustomer_success', async () => {
    repository.findByCedula.mockResolvedValue(sampleCustomer as any);
    repository.delete.mockResolvedValue(undefined);

    const req = mockRequest({}, { id: '11111111' });
    const res = mockResponse();

    await handler.delete(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: null, error: null });
  });

  // SP2-QA-08
  test('deleteCustomer_notFound', async () => {
    repository.findByCedula.mockResolvedValue(null);

    const req = mockRequest({}, { id: '99999999' });
    const res = mockResponse();

    await handler.delete(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: 'Cliente no encontrado',
    });
  });

  // SP5-QA-02
  test('listCustomers_withData', async () => {
    repository.findAll.mockResolvedValue([sampleCustomer] as any);

    const req = mockRequest();
    const res = mockResponse();

    await handler.list(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [sampleCustomer], error: null });
  });
});
