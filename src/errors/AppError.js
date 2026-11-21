class AppError extends Error {
  constructor(message, statusCode, code, details) {
    super(message);
    this.name = this.constructor.name;
    Object.assign(this, { statusCode, code, details });
  }
}
class ValidationError extends AppError {
  constructor(details) { super("Validation failed", 400, "VALIDATION_ERROR", details); }
}
class NotFoundError extends AppError {
  constructor(resource) { super(`${resource} not found`, 404, "NOT_FOUND"); }
}
class ConflictError extends AppError {
  constructor(message, code) { super(message, 409, code); }
}
class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") { super(message, 401, "UNAUTHORIZED"); }
}
class ForbiddenError extends AppError {
  constructor() { super("Insufficient permissions", 403, "FORBIDDEN"); }
}
module.exports = { UnauthorizedError, ForbiddenError, AppError, ValidationError, NotFoundError, ConflictError };
