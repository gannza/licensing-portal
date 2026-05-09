const Joi = require('joi');
const { validate } = require('../utils/validate');

const createTypeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(1).max(20).uppercase().required(),
  description: Joi.string().allow('', null),
  is_active: Joi.boolean().default(true),
});

const updateTypeSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  code: Joi.string().min(1).max(20).uppercase(),
  description: Joi.string().allow('', null),
  is_active: Joi.boolean(),
});

module.exports = {
    validateCreateApplicationType: validate(createTypeSchema),
    validateUpdateApplicationType: validate(updateTypeSchema),
}