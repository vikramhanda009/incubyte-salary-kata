import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../errors/AppError';

export const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false, 
      stripUnknown: true 
    });

    if (error) {
      const message = error.details.map(d => d.message).join(', ');
      return next(new AppError(`Validation failed: ${message}`, 400));
    }
    next();
  };
};