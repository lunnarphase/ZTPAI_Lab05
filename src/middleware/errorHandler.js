const { AppError } = require("../errors/AppError");

function createErrorHandler(logger = console) {
  return (err, req, res, next) => {
    if (res.headersSent) return next(err);
    let status = 500;
    let error = { code: "INTERNAL_ERROR", message: "Unexpected error" };
    if (err instanceof AppError) {
      status = err.statusCode;
      error = { code: err.code, message: err.message };
      if (err.details !== undefined) error.details = err.details;
    } else if (err.code === "23505") {
      status=409;error=err.constraint === "users_email_unique"
        ? {code:"EMAIL_TAKEN",message:"Email already registered"}
        : {code:"DUPLICATE_RESOURCE",message:"Resource already exists"};
    } else if (err.code === "23P01") {
      status=409;error={code:"ROOM_ALREADY_BOOKED",message:"Room already booked"};
    } else if (err.code === "23503") {
      status=409;error={code:"RELATED_RESOURCE_CONFLICT",message:"Related resource conflict"};
    } else if (err.type === "entity.parse.failed") {
      status = 400;
      error = { code: "INVALID_JSON", message: "Request body is not valid JSON" };
    } else if (err.type === "entity.too.large") {
      status = 413;
      error = { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" };
    } else {
      logger.error(`[${req.id}]`, err.stack || err);
    }
    res.status(status).json({ error: { ...error, requestId: req.id } });
  };
}
module.exports = createErrorHandler;
