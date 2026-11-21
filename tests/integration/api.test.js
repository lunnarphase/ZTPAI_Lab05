const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../../src/config");
const db = require("../../src/db/knex");
const { createApp } = require("../../src/app");
const { createRepositories, createUnitOfWork } = require("../../src/db/repositories.knex");
const { createUsersRepository } = require("../../src/modules/auth/users.repository.knex");
const { createAuditRepository } = require("../../src/modules/audit/audit.repository.knex");
const { createEventBus } = require("../../src/events/eventBus");
const { registerListeners } = require("../../src/events/listeners");
const logger = { log: jest.fn(), error: jest.fn() };
const eventBus = createEventBus(logger);
const usersRepository = createUsersRepository(db);
const auditRepository = createAuditRepository(db);
registerListeners({ eventBus, auditRepository, usersRepository, logger });
const NOW = new Date("2026-12-01T08:00:00Z");
const app = createApp({ config, ...createRepositories(db), usersRepository, auditRepository,
  eventBus, logger, runInTransaction: createUnitOfWork(db), now: () => new Date(NOW) });
const token = (id = 2, role = "USER") => jwt.sign({ role }, config.JWT_SECRET,
  { algorithm: "HS256", subject: String(id), expiresIn: "15m" });
const auth = (req, id = 2, role = "USER") => req.set("Authorization", `Bearer ${token(id, role)}`);
const body = extra => ({ roomId: 1, participants: 5,
  startTime: "2026-12-02T10:00:00Z", endTime: "2026-12-02T11:00:00Z", ...extra });
beforeAll(async () => { await db.migrate.latest(); });
beforeEach(async () => {
  await eventBus.drain();
  await db.raw("TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE");
  const password_hash = await bcrypt.hash("demo-password-123", 10);
  await db("users").insert([
    { email: "admin@example.com", password_hash, role: "ADMIN" },
    { email: "anna@example.com", password_hash, role: "USER" },
    { email: "jan@example.com", password_hash, role: "USER" }
  ]);
  await db("buildings").insert({ name: "A", address: "Test address" });
  await db("rooms").insert({ building_id: 1, name: "101", capacity: 10 });
});
afterEach(async () => { await eventBus.drain(); });
afterAll(async () => { await eventBus.drain(); await db.destroy(); });
test("registration, login and me", async () => {
  const credentials = { email: "NOWY@example.com", password: "demo-password-123" };
  const register = await request(app).post("/api/auth/register").send(credentials).expect(201);
  expect(register.body).toMatchObject({ email: "nowy@example.com", role: "USER" });
  expect(register.body).not.toHaveProperty("passwordHash");
  const login = await request(app).post("/api/auth/login").send(credentials).expect(200);
  const me = await request(app).get("/api/auth/me")
    .set("Authorization", `Bearer ${login.body.accessToken}`).expect(200);
  expect(me.body.id).toBe(register.body.id);
});
test("POST 201 includes Location and persists record", async () => {
  const response = await auth(request(app).post("/api/reservations")).send(body()).expect(201);
  expect(response.headers.location).toBe(`/api/reservations/${response.body.id}`);
  const row = await db("reservations").where({ id: response.body.id }).first();
  expect(row).toMatchObject({ user_id: 2, room_id: 1, participants: 5 });
});
test("400 includes body field details", async () => {
  const r = await auth(request(app).post("/api/reservations"))
    .send(body({ participants: 0 })).expect(400);
  expect(r.body.error).toMatchObject({ code: "VALIDATION_ERROR",
    details: expect.arrayContaining([expect.objectContaining({ location: "body", field: "participants" })]) });
});
test("401 without token", async () => {
  const r = await request(app).get("/api/rooms").expect(401);
  expect(r.body.error.code).toBe("UNAUTHORIZED");
});
test("403 when USER creates room", async () => {
  const r = await auth(request(app).post("/api/rooms"))
    .send({ name: "102", capacity: 10, buildingId: 1 }).expect(403);
  expect(r.body.error.code).toBe("FORBIDDEN");
});
test("404 for another user's private reservation", async () => {
  const created = await auth(request(app).post("/api/reservations")).send(body()).expect(201);
  const r = await auth(request(app).get(`/api/reservations/${created.body.id}`), 3).expect(404);
  expect(r.body.error.code).toBe("NOT_FOUND");
});
test("409 ROOM_ALREADY_BOOKED for overlap", async () => {
  await auth(request(app).post("/api/reservations")).send(body()).expect(201);
  const r = await auth(request(app).post("/api/reservations")).send(body()).expect(409);
  expect(r.body.error.code).toBe("ROOM_ALREADY_BOOKED");
});
test("pagination returns filtered total and limited data", async () => {
  for (let hour = 10; hour < 13; hour++) await auth(request(app).post("/api/reservations"))
    .send(body({ startTime: `2026-12-02T${hour}:00:00Z`, endTime: `2026-12-02T${hour + 1}:00:00Z` })).expect(201);
  const r = await auth(request(app).get("/api/reservations?limit=2&page=1")).expect(200);
  expect(r.body.data).toHaveLength(2);
  expect(r.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
});
test("audit sequence emits exactly creation and cancellation", async () => {
  const c = await auth(request(app).post("/api/reservations")).send(body()).expect(201);
  await auth(request(app).post("/api/reservations")).send(body()).expect(409);
  await auth(request(app).patch(`/api/reservations/${c.body.id}/cancel`), 1, "ADMIN").expect(200);
  await auth(request(app).patch(`/api/reservations/${c.body.id}/cancel`), 1, "ADMIN").expect(200);
  await eventBus.drain();
  const rows = await db("audit_log").orderBy("id");
  expect(rows.map(x => x.event_type)).toEqual(["reservation.created", "reservation.cancelled"]);
  expect(rows[1].payload).toMatchObject({ userId: 2, cancelledBy: 1 });
  expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("[notification] to: anna@example.com"));
  const r = await auth(request(app).get("/api/admin/audit-log?eventType=reservation.cancelled&limit=1"), 1, "ADMIN").expect(200);
  expect(r.body.meta.total).toBe(1);
  expect(r.body.data[0].eventType).toBe("reservation.cancelled");
});
test("USER cannot access audit log", async () => {
  const r = await auth(request(app).get("/api/admin/audit-log")).expect(403);
  expect(r.body.error.code).toBe("FORBIDDEN");
});
test("audit listener failure leaves POST successful and logs the error", async () => {
  const spy = jest.spyOn(auditRepository, "append").mockRejectedValueOnce(new Error("temporary audit failure"));
  try {
    await auth(request(app).post("/api/reservations")).send(body()).expect(201);
    await eventBus.drain();
    expect(logger.error).toHaveBeenCalledWith("[event:reservation.created] handler failed", "temporary audit failure");
    expect(await db("reservations").count("* as total").first()).toMatchObject({ total: "1" });
  } finally { spy.mockRestore(); }
});
