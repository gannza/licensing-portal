const Joi = require('joi');
const { validate } = require('../utils/validate');

const createSchema = Joi.object({
  application_type_id: Joi.string().uuid().required(),
});

const transitionSchema = Joi.object({
  toState: Joi.string().required(),
  decisionType: Joi.string().valid('APPROVED_STAGE', 'REQUEST_INFO', 'ESCALATED').optional(),
  decisionNote: Joi.string().allow('', null),
});

module.exports = {
    validateCreateApplication: validate(createSchema),
    validateTransition: validate(transitionSchema),
}