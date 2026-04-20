export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = statusCode < 500;

    Error.captureStackTrace(this, this.constructor);
  }
}