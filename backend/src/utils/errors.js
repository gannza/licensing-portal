class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class ValidationError extends AppError {
  constructor(message) { super(message, 400, 'VALIDATION_ERROR'); }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') { super(message, 403, 'UNAUTHORIZED'); }
}

class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') { super(message, 403, 'FORBIDDEN'); }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') { super(`${resource} not found`, 404, 'NOT_FOUND'); }
}

class ConflictError extends AppError {
  constructor(message = 'Version conflict — please refresh and retry') { super(message, 409, 'CONFLICT'); }
}

class UnprocessableError extends AppError {
  constructor(message) { super(message, 422, 'UNPROCESSABLE'); }
}

module.exports = { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, UnprocessableError };
