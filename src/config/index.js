const { z } = require("zod");
try { process.loadEnvFile(); } catch (e) { if (e.code !== "ENOENT") throw e; }
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(0).max(65535).default(3005),
  DATABASE_URL: z.url().refine(s => /^postgres(ql)?:\/\//.test(s), "PostgreSQL URL required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must have at least 32 characters"),
  JWT_EXPIRES_IN: z.string().regex(/^[1-9][0-9]*[smhd]$/).default("15m"),
  POSTGRES_PASSWORD: z.string().min(1)
});
const result = schema.safeParse(process.env);
if (!result.success) {
  console.error("Invalid environment configuration:");
  for (const issue of result.error.issues)
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}
module.exports = Object.freeze(result.data);
