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

  // ================= CREATE =================
  describe('POST /api/employees', () => {

    it('should create an employee and return 201', async () => {
      const res = await request(app).post('/api/employees').send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        fullName: 'Vikram Singh',
        jobTitle: 'Senior Software Engineer',
        country: 'India',
        salary: 1500000
      });
      expect(res.body.id).toBeDefined();
    });

    it('should return 400 for negative salary', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validPayload, salary: -100 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for zero salary', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validPayload, salary: 0 });

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

    it('should return 400 for invalid payload type', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validPayload, salary: "invalid" });

      expect(res.status).toBe(400);
    });

  });

  // ================= READ =================
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
        data: validPayload
      });

      const res = await request(app).get(`/api/employees/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe(validPayload.fullName);
    });

    it('should return 404 for non-existent employee', async () => {
      const res = await request(app).get('/api/employees/99999');

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app).get('/api/employees/invalid-id');

      expect(res.status).toBe(400);
    });

  });

  // ================= UPDATE =================
  describe('PUT /api/employees/:id', () => {

    it('should update employee partially', async () => {
      const created = await prisma.employee.create({
        data: validPayload
      });

      const res = await request(app)
        .put(`/api/employees/${created.id}`)
        .send({ salary: 200000 });

      expect(res.status).toBe(200);
      expect(res.body.salary).toBe(200000);
    });

    it('should return 400 for invalid salary update', async () => {
      const created = await prisma.employee.create({
        data: validPayload
      });

      const res = await request(app)
        .put(`/api/employees/${created.id}`)
        .send({ salary: -500 });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent employee', async () => {
      const res = await request(app)
        .put('/api/employees/99999')
        .send({ salary: 100000 });

      expect(res.status).toBe(404);
    });
    it('should return 400 when updating salary to zero', async () => {
      const created = await prisma.employee.create({
        data: { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 }
      });
      const res = await request(app)
        .put(`/api/employees/${created.id}`)
        .send({ salary: 0 });
      expect(res.status).toBe(400);
    });
    it('should return 400 when updating salary to a negative value', async () => {
      const created = await prisma.employee.create({
        data: { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 }
      });
      const res = await request(app)
        .put(`/api/employees/${created.id}`)
        .send({ salary: -500 });
      expect(res.status).toBe(400);
    });

  });

  // ================= DELETE =================
  describe('DELETE /api/employees/:id', () => {

    it('should delete employee and verify removal', async () => {
      const created = await prisma.employee.create({
        data: validPayload
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

  // ================= ERROR HANDLING =================
  describe('Error Handling', () => {

    it('should handle unexpected server errors', async () => {
      jest.spyOn(prisma.employee, 'findMany').mockImplementationOnce(() => {
        throw new Error('DB Error');
      });

      const res = await request(app).get('/api/employees');

      expect(res.status).toBe(500);
    });

  });
it('should return 400 when request body is empty', async () => {
  const res = await request(app)
    .post('/api/employees')
    .send({});

  expect(res.status).toBe(400);
});
it('should return 400 for invalid ID format', async () => {
  const res = await request(app)
    .get('/api/employees/invalid-id');

  expect(res.status).toBe(400);
});

it('should return 500 if database fails', async () => {
  jest.spyOn(prisma.employee, 'findMany').mockImplementationOnce(() => {
    throw new Error('DB error');
  });

  const res = await request(app).get('/api/employees');
  expect(res.status).toBe(500);
  expect(res.body.error).toBe("Internal Server Error");
});

it('should fail when updating employee with zero salary', async () => {
  const res = await request(app)
    .put('/api/employees/1')
    .send({
      fullName: "Test",
      jobTitle: "Dev",
      country: "India",
      salary: 0
    });

  expect(res.statusCode).toBe(400);
});
it('should fail when updating employee with negative salary', async () => {
  const res = await request(app)
    .put('/api/employees/1')
    .send({
      fullName: "Test",
      jobTitle: "Dev",
      country: "India",
      salary: -100
    });

  expect(res.statusCode).toBe(400);
});
});