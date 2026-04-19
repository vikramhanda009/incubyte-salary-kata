import Joi from 'joi';

export const createEmployeeSchema = Joi.object({
  fullName: Joi.string().trim().min(3).max(100).required(),
  jobTitle: Joi.string().trim().min(3).max(100).required(),
  country: Joi.string().trim().min(2).max(100).required(),
  salary: Joi.number().positive().required()
});

export const updateEmployeeSchema = Joi.object({
  fullName: Joi.string().trim().min(3).max(100),
  jobTitle: Joi.string().trim().min(3).max(100),
  country: Joi.string().trim().min(2).max(100),
  salary: Joi.number().positive()
}).min(1);