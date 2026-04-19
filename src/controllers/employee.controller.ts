import { Request, Response, NextFunction } from 'express';
import { EmployeeRepository } from '../repositories/employee.repository';
import { SalaryService } from '../services/salary.service';
import { AppError } from '../errors/AppError';

const repo = new EmployeeRepository();
const salaryService = new SalaryService();

// ✅ Utility (Senior-level reusable fix)
const getParam = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

const parseId = (idParam: string | string[]): number => {
  const id = parseInt(getParam(idParam), 10);
  if (isNaN(id)) throw new AppError('Invalid ID', 400);
  return id;
};

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await repo.create(req.body);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

export const getAllEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employees = await repo.findAll();
    res.json(employees);
  } catch (err) {
    next(err);
  }
};

export const getEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);

    const employee = await repo.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    res.json(employee);
  } catch (err) {
    next(err);
  }
};

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);

    const employee = await repo.update(id, req.body);
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);

    await repo.delete(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const calculateNetSalary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);

    const employee = await repo.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    const breakdown = salaryService.calculateNetSalary(
      Number(employee.salary),
      employee.country
    );

    res.json({
      employeeId: employee.id,
      fullName: employee.fullName,
      ...breakdown
    });
  } catch (err) {
    next(err);
  }
};

export const getCountryMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = getParam(req.params.country);

    const employees = await repo.findByCountry(country);
    if (!employees.length) {
      throw new AppError(`No employees found in country: ${country}`, 404);
    }

    const salaries = employees.map(e => Number(e.salary));
    const avg = salaries.reduce((a, b) => a + b, 0) / salaries.length;

    res.json({
      country,
      minSalary: Math.min(...salaries),
      maxSalary: Math.max(...salaries),
      avgSalary: Number(avg.toFixed(2)),
      count: employees.length
    });
  } catch (err) {
    next(err);
  }
};

export const getJobTitleAverage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobTitle = getParam(req.params.jobTitle);

    const result = await repo.getAverageByJobTitle(jobTitle);

    // ✅ safe + correct
   const count = (result._count as { _all: number })._all;

    if (count === 0) {
      throw new AppError(`No employees with job title: ${jobTitle}`, 404);
    }

    const avgSalary = result._avg?.salary
      ? Number(result._avg.salary.toFixed(2))
      : 0;

    res.json({
      jobTitle,
      averageSalary: avgSalary,
      count
    });

  } catch (err) {
    next(err);
  }
};