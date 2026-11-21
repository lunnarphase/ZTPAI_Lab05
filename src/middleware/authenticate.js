const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../errors/AppError");
module.exports = secret => (req, res, next) => {
  const match = /^Bearer ([^\s]+)$/.exec(req.get("Authorization") || "");
  if (!match) return next(new UnauthorizedError("Bearer token required"));
  try {
    const payload = jwt.verify(match[1], secret, { algorithms: ["HS256"] });
    if (!/^[1-9][0-9]*$/.test(payload.sub) ||
        !Number.isSafeInteger(Number(payload.sub)) ||
        !["USER", "ADMIN"].includes(payload.role) ||
        !Number.isInteger(payload.iat) || !Number.isInteger(payload.exp))
      throw new Error("Invalid claims");
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch (err) {
    const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    next(new UnauthorizedError(message));
  }
};
