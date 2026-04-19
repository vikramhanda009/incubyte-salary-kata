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
  describe('GET /api/salary/:id', () => {
    it('should calculate 10% TDS for India', async () => {
      const employee = await prisma.employee.create({
        data: { fullName: 'Rahul', jobTitle: 'Engineer', country: 'India', salary: 100000 }
      });
      const res = await request(app).get(`/api/salary/${employee.id}`);
      expect(res.status).toBe(200);
      expect(res.body.tds).toBe(10000);
      expect(res.body.netSalary).toBe(90000);
      expect(res.body.grossSalary).toBe(100000);
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
      expect(res.body.avgSalary).toBe(100000);
      expect(res.body.minSalary).toBe(80000);
      expect(res.body.maxSalary).toBe(120000);
      expect(res.body.count).toBe(3);
    });

    it('should return 404 if no employees in country', async () => {
      const res = await request(app).get('/api/metrics/country/Antarctica');
      expect(res.status).toBe(404);
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
  });
});
