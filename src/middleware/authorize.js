const { UnauthorizedError, ForbiddenError } = require("../errors/AppError");
module.exports = (...roles) => (req, res, next) => {
  if (!req.user) return next(new UnauthorizedError());
  if (!roles.includes(req.user.role)) return next(new ForbiddenError());
  next();
};
