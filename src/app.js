const express = require("express");
const createRequestLogger = require("./middleware/requestLogger");
const createErrorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const { createRoomsService } = require("./modules/rooms/rooms.service");
const { createRoomsController } = require("./modules/rooms/rooms.controller");
const { createRoomsRouter } = require("./modules/rooms/rooms.routes");
const { createReservationsService } = require("./modules/reservations/reservations.service");
const { createReservationsController } = require("./modules/reservations/reservations.controller");
const { createReservationsRouter } = require("./modules/reservations/reservations.routes");

const {createBuildingsService}=require("./modules/buildings/buildings.service");
const {createBuildingsController}=require("./modules/buildings/buildings.controller");
const {createBuildingsRouter}=require("./modules/buildings/buildings.routes");
function createApp({ config, usersRepository, roomsRepository, reservationsRepository, buildingsRepository, runInTransaction,
  eventBus, auditRepository, now = () => new Date(), logger = console, enableDebug = false }) {
  const app = express();
  const swaggerUi = require("swagger-ui-express");
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(require("./docs/openapi.json")));
  const authenticate = require("./middleware/authenticate")(config.JWT_SECRET);
  app.use(createRequestLogger(logger));
  app.use(express.json());
  const authService = require("./modules/auth/auth.service").createAuthService({ usersRepository, config });
  app.use("/api/auth", require("./modules/auth/auth.routes")({ service: authService, usersRepository, authenticate }));
  app.use(authenticate);
  const roomsService = createRoomsService({ roomsRepository, buildingsRepository });
  const reservationsService = createReservationsService({
    roomsRepository, reservationsRepository, now, runInTransaction, eventBus
  });
  app.use("/api/buildings",createBuildingsRouter(createBuildingsController(createBuildingsService({buildingsRepository,roomsRepository}))));
  app.use("/api/rooms", createRoomsRouter(createRoomsController(roomsService)));
  app.use("/api/reservations", createReservationsRouter(
    createReservationsController(reservationsService)));
  const { z } = require("zod");
  const validate = require("./middleware/validate");
  const authorize = require("./middleware/authorize");
  app.get("/api/admin/audit-log", authorize("ADMIN"), validate({ query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    eventType: z.enum(["reservation.created", "reservation.cancelled"]).optional()
  }).strict() }), async (req, res) => res.json(await auditRepository.list(req.validated.query)));
  if (enableDebug) app.get("/api/debug/crash", async () => { throw new Error("boom"); });
  app.use(notFound);
  app.use(createErrorHandler(logger));
  return app;
}
module.exports = { createApp };
