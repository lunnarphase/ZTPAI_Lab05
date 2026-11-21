const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ConflictError, UnauthorizedError } = require("../../errors/AppError");
function createAuthService({ usersRepository, config }) {
  return {
    async register({ email, password }) {
      if (await usersRepository.findByEmail(email))
        throw new ConflictError("Email already registered", "EMAIL_TAKEN");
      const passwordHash = await bcrypt.hash(password, 12);
      return usersRepository.create({ email, passwordHash, role: "USER" });
    },
    async login({ email, password }) {
      const user = await usersRepository.findByEmail(email);
      if (!user || !await bcrypt.compare(password, user.passwordHash))
        throw new UnauthorizedError("Invalid email or password");
      return { accessToken: jwt.sign({ role: user.role }, config.JWT_SECRET, {
        algorithm: "HS256",
        subject: String(user.id),
        expiresIn: config.JWT_EXPIRES_IN
      }), tokenType: "Bearer", expiresIn: config.JWT_EXPIRES_IN };
    }
  };
}
module.exports = { createAuthService };
