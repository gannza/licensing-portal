
const Joi = require('joi');
const { validate } = require('../utils/validate');

const createDocRequirementSchema = Joi.object({
  key: Joi.string().min(1).max(100).required(),
  label: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('', null),
  is_required: Joi.boolean().default(true),
  allowed_mime_types: Joi.array().items(Joi.string()).allow(null),
  max_size_bytes: Joi.number().integer().positive().default(5242880),
  display_order: Joi.number().integer().min(0).default(0),
});

const updateDocRequirementSchema = Joi.object({
  key: Joi.string().min(1).max(100),
  label: Joi.string().min(1).max(200),
  description: Joi.string().allow('', null),
  is_required: Joi.boolean(),
  allowed_mime_types: Joi.array().items(Joi.string()).allow(null),
  max_size_bytes: Joi.number().integer().positive(),
  display_order: Joi.number().integer().min(0),
});

module.exports = {
    validateCreateDocRequirement: validate(createDocRequirementSchema),
    validateUpdateDocRequirement: validate(updateDocRequirementSchema),
}