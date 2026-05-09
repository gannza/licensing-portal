
const Joi = require('joi');
const { validate } = require('../utils/validate');

const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter and one number",
    }),
  full_name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().allow("", null),
  institution_name: Joi.string().min(2).max(200).required(),
  institution_registration_number: Joi.string().min(2).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().allow("", null),
  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*\d)/)
    .required(),
});

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateChangePassword: validate(changePasswordSchema),
};
