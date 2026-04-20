import { AppError } from '../../src/errors/AppError';
describe('AppError', () => {
  it('should create error with message and status', () => {
    const error = new AppError('Test error', 400);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
  });

  it('should default to 500 if no status provided', () => {
    const error = new AppError('Error');

    expect(error.statusCode).toBe(500);
  });
});