import { Request, Response, NextFunction } from 'express';
import { EmployeeRepository } from '../repositories/employee.repository';
import { SalaryService } from '../services/salary.service';
import { AppError } from '../errors/AppError';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../types/employee.types';

const repo = new EmployeeRepository();
const salaryService = new SalaryService();

const parseId = (idParam: string | string[]): number => {
  const raw = Array.isArray(idParam) ? idParam[0] : idParam;
  const id = parseInt(raw, 10);
  if (isNaN(id)) throw new AppError('Invalid ID', 400);
  return id;
};

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto: CreateEmployeeDto = {
      fullName: req.body.fullName,
      jobTitle: req.body.jobTitle,
      country: req.body.country,
      salary: req.body.salary,
    };
    const employee = await repo.create(dto);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

export const getAllEmployees = async (_req: Request, res: Response, next: NextFunction) => {
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
    const dto: UpdateEmployeeDto = {};
    if (req.body.fullName !== undefined) dto.fullName = req.body.fullName;
    if (req.body.jobTitle !== undefined) dto.jobTitle = req.body.jobTitle;
    if (req.body.country !== undefined) dto.country = req.body.country;
    if (req.body.salary !== undefined) dto.salary = req.body.salary;
    const employee = await repo.update(id, dto);
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

// GET /api/salary/:id?gross=120000
// If ?gross is provided, that value is used as the gross salary for calculation.
// If omitted, the employee's stored salary is used.
export const calculateNetSalary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);
    const employee = await repo.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    // Use query param gross if provided, otherwise fall back to stored salary
    const rawGross = req.query.gross;
    let gross: number;

    if (rawGross !== undefined) {
      gross = parseFloat(rawGross as string);
      
      if (isNaN(gross)) {
        throw new AppError('gross must be a non-negative number', 400);
      }
      if (gross <= 0) {
        throw new AppError("Salary must be greater than zero", 400);
      }
    } else {
      gross = Number(employee.salary);
    }

    const breakdown = salaryService.calculateNetSalary(gross, employee.country);

    res.json({
      employeeId: employee.id,
      fullName: employee.fullName,
      ...breakdown,
    });
  } catch (err) {
    next(err);
  }
};

export const getCountryMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = Array.isArray(req.params.country) ? req.params.country[0] : req.params.country;
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
      count: employees.length,
    });
  } catch (err) {
    next(err);
  }
};

export const getJobTitleAverage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobTitle = Array.isArray(req.params.jobTitle) ? req.params.jobTitle[0] : req.params.jobTitle;
    const result = await repo.getAverageByJobTitle(jobTitle);
    const count = (result._count as { _all: number })._all;

    if (count === 0) {
      throw new AppError(`No employees with job title: ${jobTitle}`, 404);
    }

    const averageSalary = result._avg?.salary
      ? Number(result._avg.salary.toFixed(2))
      : 0;

    res.json({ jobTitle, averageSalary, count });
  } catch (err) {
    next(err);
  }
};