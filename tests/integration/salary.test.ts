import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/lib/prisma';

beforeEach(async () => {
  await prisma.employee.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Salary Calculation & Metrics', () => {

  describe('GET /api/salary/:id — using stored salary', () => {
    it('should calculate 10% TDS for India', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'Rahul', jobTitle: 'Engineer', country: 'India', salary: 100000 }
      });
      const res = await request(app).get(`/api/salary/${employee.id}`);
      expect(res.status).toBe(200);
      expect(res.body.grossSalary).toBe(100000);
      expect(res.body.tds).toBe(10000);
      expect(res.body.netSalary).toBe(90000);
    });

    it('should calculate 12% TDS for United States', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'John', jobTitle: 'Manager', country: 'United States', salary: 100000 }
      });
      const res = await request(app).get(`/api/salary/${employee.id}`);
      expect(res.status).toBe(200);
      expect(res.body.tds).toBe(12000);
      expect(res.body.netSalary).toBe(88000);
    });

    it('should have 0 TDS for other countries', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'Akira', jobTitle: 'Dev', country: 'Japan', salary: 100000 }
      });
      const res = await request(app).get(`/api/salary/${employee.id}`);
      expect(res.status).toBe(200);
      expect(res.body.tds).toBe(0);
      expect(res.body.netSalary).toBe(100000);
    });

    it('should return 404 for non-existent employee', async () => {
      const res = await request(app).get('/api/salary/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/salary/:id?gross= — using provided gross salary', () => {
    it('should use provided gross instead of stored salary for India', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'Rahul', jobTitle: 'Engineer', country: 'India', salary: 50000 }
      });
      // Pass a different gross — should use 200000, not the stored 50000
      const res = await request(app).get(`/api/salary/${employee.id}?gross=200000`);
      expect(res.status).toBe(200);
      expect(res.body.grossSalary).toBe(200000);
      expect(res.body.tds).toBe(20000);
      expect(res.body.netSalary).toBe(180000);
    });

    it('should use provided gross for United States', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'John', jobTitle: 'Dev', country: 'United States', salary: 50000 }
      });
      const res = await request(app).get(`/api/salary/${employee.id}?gross=150000`);
      expect(res.status).toBe(200);
      expect(res.body.grossSalary).toBe(150000);
      expect(res.body.tds).toBe(18000);
      expect(res.body.netSalary).toBe(132000);
    });

    it('should return 400 for invalid gross value', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 }
      });
      const res = await request(app).get(`/api/salary/${employee.id}?gross=abc`);
      expect(res.status).toBe(400);
    });

    it('should return 400 for negative gross value', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 }
      });
      const res = await request(app).get(`/api/salary/${employee.id}?gross=-5000`);
      expect(res.status).toBe(400);
    });

    it('should return 400 for zero gross value', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 }
      });
      const res = await request(app).get(`/api/salary/${employee.id}?gross=0`);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/metrics/country/:country', () => {
    it('should return min, max and avg salary for a country', async () => {
      await prisma.employee.createMany({
        data: [
          { fullName: 'E1', jobTitle: 'Dev', country: 'India', salary: 80000 },
          { fullName: 'E2', jobTitle: 'Dev', country: 'India', salary: 120000 },
          { fullName: 'E3', jobTitle: 'Dev', country: 'India', salary: 100000 }
        ]
      });
      const res = await request(app).get('/api/metrics/country/India');
      expect(res.status).toBe(200);
      expect(res.body.minSalary).toBe(80000);
      expect(res.body.maxSalary).toBe(120000);
      expect(res.body.avgSalary).toBe(100000);
      expect(res.body.count).toBe(3);
    });

    it('should return 404 if no employees in country', async () => {
      const res = await request(app).get('/api/metrics/country/Antarctica');
      expect(res.status).toBe(404);
    });

    it('should not mix employees from different countries', async () => {
      await prisma.employee.createMany({
        data: [
          { fullName: 'A', jobTitle: 'Dev', country: 'India', salary: 60000 },
          { fullName: 'B', jobTitle: 'Dev', country: 'United States', salary: 200000 }
        ]
      });
      const res = await request(app).get('/api/metrics/country/India');
      expect(res.body.maxSalary).toBe(60000);
      expect(res.body.count).toBe(1);
    });
  });

  describe('GET /api/metrics/job-title/:jobTitle', () => {
    it('should return average salary for a job title', async () => {
      await prisma.employee.createMany({
        data: [
          { fullName: 'A', jobTitle: 'Engineer', country: 'India', salary: 80000 },
          { fullName: 'B', jobTitle: 'Engineer', country: 'India', salary: 120000 }
        ]
      });
      const res = await request(app).get('/api/metrics/job-title/Engineer');
      expect(res.status).toBe(200);
      expect(res.body.averageSalary).toBe(100000);
      expect(res.body.count).toBe(2);
    });

    it('should return 404 if no employees with that job title', async () => {
      const res = await request(app).get('/api/metrics/job-title/Astronaut');
      expect(res.status).toBe(404);
    });

    // Edge case: employees existed but were all deleted — should return 404
    it('should return 404 after all employees with that job title are deleted', async () => {
      const e1 = await prisma.employee.create({
        data: { fullName: 'A', jobTitle: 'TempRole', country: 'India', salary: 80000 }
      });
      const e2 = await prisma.employee.create({
        data: { fullName: 'B', jobTitle: 'TempRole', country: 'India', salary: 90000 }
      });
      // Confirm they exist
      const before = await request(app).get('/api/metrics/job-title/TempRole');
      expect(before.status).toBe(200);

      // Delete all
      await request(app).delete(`/api/employees/${e1.id}`);
      await request(app).delete(`/api/employees/${e2.id}`);

      // Now should return 404
      const after = await request(app).get('/api/metrics/job-title/TempRole');
      expect(after.status).toBe(404);
    });

    it('should not mix employees from different job titles', async () => {
      await prisma.employee.createMany({
        data: [
          { fullName: 'A', jobTitle: 'Engineer', country: 'India', salary: 80000 },
          { fullName: 'B', jobTitle: 'Manager', country: 'India', salary: 200000 }
        ]
      });
      const res = await request(app).get('/api/metrics/job-title/Engineer');
      expect(res.body.averageSalary).toBe(80000);
      expect(res.body.count).toBe(1);
    });
    it('should return 400 for zero gross value', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'Alice', jobTitle: 'Dev', country: 'India', salary: 100000 }
      });
      const res = await request(app).get(`/api/salary/${employee.id}?gross=0`);
      expect(res.status).toBe(400);
    });
  });
});