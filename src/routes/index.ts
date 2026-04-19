import { Router } from 'express';
import * as controller from '../controllers/employee.controller';
import { validate } from '../middlewares/validate';
import { createEmployeeSchema, updateEmployeeSchema } from '../validations/employee.validation';

const router = Router();

router.post('/employees', validate(createEmployeeSchema), controller.createEmployee);
router.get('/employees', controller.getAllEmployees);
router.get('/employees/:id', controller.getEmployee);
router.put('/employees/:id', validate(updateEmployeeSchema), controller.updateEmployee);
router.delete('/employees/:id', controller.deleteEmployee);

router.get('/salary/:id', controller.calculateNetSalary);
router.get('/metrics/country/:country', controller.getCountryMetrics);
router.get('/metrics/job-title/:jobTitle', controller.getJobTitleAverage);

export default router;