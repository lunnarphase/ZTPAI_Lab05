const { Router } = require("express");
const { z } = require("zod");
const validate = require("../../middleware/validate");
const { NotFoundError } = require("../../errors/AppError");
const credentials = z.object({ email: z.email().toLowerCase(),
  password: z.string().min(10).max(72)
    .refine(p => Buffer.byteLength(p, "utf8") <= 72, "Password exceeds 72 UTF-8 bytes") }).strict();
const login = z.object({ email: z.email().toLowerCase(), password: z.string().min(1).max(72) }).strict();
const publicUser = u => ({ id: u.id, email: u.email, role: u.role, createdAt: u.createdAt });
module.exports = ({ service, usersRepository, authenticate }) => {
  const r = Router();
  r.post("/register", validate({ body: credentials }), async (req, res) => {
    res.status(201).json(publicUser(await service.register(req.validated.body)));
  });
  r.post("/login", validate({ body: login }), async (req, res) => {
    res.json(await service.login(req.validated.body));
  });
  r.get("/me", authenticate, async (req, res) => {
    const user = await usersRepository.findById(req.user.id);
    if (!user) throw new NotFoundError("User");
    res.json(publicUser(user));
  });
  return r;
};
