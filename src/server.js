const config = require("./config");
const db = require("./db/knex");
const { createRepositories, createUnitOfWork } = require("./db/repositories.knex");
const { createUsersRepository } = require("./modules/auth/users.repository.knex");
const { createAuditRepository } = require("./modules/audit/audit.repository.knex");
const { createEventBus } = require("./events/eventBus");
const { registerListeners } = require("./events/listeners");
const { createApp } = require("./app");
const usersRepository = createUsersRepository(db);
const auditRepository = createAuditRepository(db);
const eventBus = createEventBus();
registerListeners({ eventBus, auditRepository, usersRepository });
const app = createApp({ config, ...createRepositories(db), usersRepository,
  auditRepository, eventBus, runInTransaction: createUnitOfWork(db) });
const server = app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`Lab05 listening on ${server.address().port}`);
  if (process.send) process.send({ port: server.address().port });
});
let stopping = false;
function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await eventBus.drain();
    await db.destroy();
    console.log("HTTP closed, event listeners drained, database pool closed");
    process.exit(0);
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
