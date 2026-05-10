const Joi = require('joi');
const { validate } = require('../utils/validate');

const createWorkflowSchema = Joi.object({
  application_type_id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow('', null),
});

const createStateSchema = Joi.object({
  key: Joi.string().min(1).max(100).uppercase().required(),
  label: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('', null),
  is_initial: Joi.boolean().default(false),
  is_terminal: Joi.boolean().default(false),
  display_order: Joi.number().integer().min(0).default(0),
});

const updateWorkflowSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().allow('', null),
});

const updateStateSchema = Joi.object({
  key: Joi.string().min(1).max(100).uppercase(),
  label: Joi.string().min(1).max(200),
  description: Joi.string().allow('', null),
  is_initial: Joi.boolean(),
  is_terminal: Joi.boolean(),
  display_order: Joi.number().integer().min(0),
});

const createTransitionSchema = Joi.object({
  from_state_key: Joi.string().min(1).max(100).required(),
  to_state_key: Joi.string().min(1).max(100).required(),
  required_role: Joi.string()
    .valid('APPLICANT', 'INTAKE_OFFICER', 'REVIEWER', 'LEGAL_OFFICER', 'FINANCIAL_OFFICER', 'APPROVER')
    .required(),
  requires_decision: Joi.boolean().default(false),
  label: Joi.string().allow('', null),
});

const updateTransitionSchema = Joi.object({
  from_state_key: Joi.string().min(1).max(100),
  to_state_key: Joi.string().min(1).max(100),
  required_role: Joi.string()
    .valid('APPLICANT', 'INTAKE_OFFICER', 'REVIEWER', 'LEGAL_OFFICER', 'FINANCIAL_OFFICER', 'APPROVER'),
  requires_decision: Joi.boolean(),
  label: Joi.string().allow('', null),
});

module.exports = {
    validateCreateWorkflow: validate(createWorkflowSchema),
    validateCreateState: validate(createStateSchema),
    validateUpdateWorkflow: validate(updateWorkflowSchema),
    validateUpdateState: validate(updateStateSchema),
     validateCreateTransition: validate(createTransitionSchema),
     validateUpdateTransition: validate(updateTransitionSchema)
}