const Joi = require('joi');
const { validate } = require('../utils/validate');


const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  full_name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().allow('', null),
  workflow_roles: Joi.array().items(Joi.object({
    workflow_id: Joi.string().uuid().required(),
    role: Joi.string().valid('INTAKE_OFFICER', 'REVIEWER', 'LEGAL_OFFICER', 'FINANCIAL_OFFICER', 'APPROVER').required(),
  })).default([]),
});

module.exports = {
    validateCreateUser: validate(createUserSchema)
}