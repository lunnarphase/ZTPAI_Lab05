const { randomBytes } = require("node:crypto");
try { process.loadEnvFile(); } catch (e) { if (e.code !== "ENOENT") throw e; }
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ||
  "postgres://postgres@localhost:5432/room_booking_lab05_test";
const url = new URL(process.env.DATABASE_URL);
if (!url.pathname.endsWith("_test")) throw new Error("A dedicated _test database is required");
process.env.JWT_SECRET = randomBytes(48).toString("hex");
process.env.POSTGRES_PASSWORD = "test-only-unused";
process.env.JWT_EXPIRES_IN = "15m";
