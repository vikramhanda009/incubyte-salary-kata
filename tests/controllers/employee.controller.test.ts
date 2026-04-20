import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/lib/prisma';
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

it('should return 400 when request body is empty', async () => {
  const res = await request(app)
    .post('/api/employees')
    .send({});

  expect(res.status).toBe(400);
});
it('should return 500 if database fails', async () => {
  jest.spyOn(prisma.employee, 'findMany').mockImplementationOnce(() => {
    throw new Error('DB error');
  });

  const res = await request(app).get('/api/employees');

  expect(res.status).toBe(500);
});