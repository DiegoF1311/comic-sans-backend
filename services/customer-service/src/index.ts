import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import { AppDataSource } from './database';
import { CustomerRepository } from './repository/customer.repository';
import { CustomerHandler } from './handler/customer.handler';
import { customerRoutes } from './routes/customer.routes';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { service: 'customer-service', status: 'ok' }, error: null });
});

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');

    const repository = new CustomerRepository(AppDataSource);
    const handler = new CustomerHandler(repository);

    app.use(customerRoutes(handler));

    app.listen(PORT, () => {
      console.log(`customer-service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;
