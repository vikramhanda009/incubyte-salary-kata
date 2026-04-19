import { Employee } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../errors/AppError';

export class EmployeeRepository {
  private prisma = prisma;

  async create(data: any): Promise<Employee> {
    return this.prisma.employee.create({ data });
  }

  async findById(id: number): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  async findAll(): Promise<Employee[]> {
    return this.prisma.employee.findMany();
  }

  async update(id: number, data: any): Promise<Employee> {
    const exists = await this.findById(id);
    if (!exists) throw new AppError('Employee not found', 404);
    return this.prisma.employee.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    const exists = await this.findById(id);
    if (!exists) throw new AppError('Employee not found', 404);
    await this.prisma.employee.delete({ where: { id } });
  }

  async findByCountry(country: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: {country}
    });
  }

  async getAverageByJobTitle(jobTitle: string) {
    return this.prisma.employee.aggregate({
        where: { jobTitle },
      _avg: { salary: true },
     _count: { _all: true }
    });
  }
}