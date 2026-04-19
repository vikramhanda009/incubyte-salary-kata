import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import routes from './routes/index';
import { AppError } from './errors/AppError';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api', routes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Incubyte Salary Management API is running 🚀' });
});

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
