import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/lib/prisma';

beforeEach(async () => {
  await prisma.employee.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Employee CRUD', () => {
  const validPayload = {
    fullName: 'Vikram Singh',
    jobTitle: 'Senior Software Engineer',
    country: 'India',
    salary: 1500000
  };

  describe('POST /api/employees', () => {
    it('should create an employee and return 201', async () => {
      const res = await request(app).post('/api/employees').send(validPayload);
      expect(res.status).toBe(201);
      expect(res.body.fullName).toBe('Vikram Singh');
      expect(res.body.id).toBeDefined();
    });

    it('should return 400 for negative salary', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validPayload, salary: -100 });
      expect(res.status).toBe(400);
    });

    it('should return 400 when fullName is missing', async () => {
      const { fullName, ...body } = validPayload;
      const res = await request(app).post('/api/employees').send(body);
      expect(res.status).toBe(400);
    });

    it('should return 400 when jobTitle is missing', async () => {
      const { jobTitle, ...body } = validPayload;
      const res = await request(app).post('/api/employees').send(body);
      expect(res.status).toBe(400);
    });

    it('should return 400 when salary is zero', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validPayload, salary: 0 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/employees', () => {
    it('should return empty array when no employees', async () => {
      const res = await request(app).get('/api/employees');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return all employees', async () => {
      await prisma.employee.createMany({
        data: [
          { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 },
          { fullName: 'Bob', jobTitle: 'PM', country: 'UK', salary: 120000 }
        ]
      });
      const res = await request(app).get('/api/employees');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/employees/:id', () => {
    it('should return a single employee', async () => {
      const created = await prisma.employee.create({
        data: { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 }
      });
      const res = await request(app).get(`/api/employees/${created.id}`);
      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Alice');
    });

    it('should return 404 for non-existent employee', async () => {
      const res = await request(app).get('/api/employees/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('should update an employee', async () => {
      const created = await prisma.employee.create({
        data: { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 }
      });
      const res = await request(app)
        .put(`/api/employees/${created.id}`)
        .send({ fullName: 'Alice Updated', salary: 150000 });
      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Alice Updated');
      expect(res.body.salary).toBe(150000);
    });

    it('should return 404 for non-existent employee', async () => {
      const res = await request(app)
        .put('/api/employees/99999')
        .send({ salary: 100000 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should delete an employee and return 204', async () => {
      const created = await prisma.employee.create({
        data: { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 }
      });
      const del = await request(app).delete(`/api/employees/${created.id}`);
      expect(del.status).toBe(204);

      const check = await request(app).get(`/api/employees/${created.id}`);
      expect(check.status).toBe(404);
    });

    it('should return 404 when deleting non-existent employee', async () => {
      const res = await request(app).delete('/api/employees/99999');
      expect(res.status).toBe(404);
    });
  });
});
