const { noopEventBus } = require("../../events/eventBus");
const { ValidationError, NotFoundError, ConflictError, ForbiddenError } = require("../../errors/AppError");
const ALLOWED_TRANSITIONS = { CONFIRMED: ["CANCELLED"], CANCELLED: [] };
const MIN_DURATION = 15 * 60 * 1000;
const MAX_DURATION = 8 * 60 * 60 * 1000;

function createReservationsService({ roomsRepository, reservationsRepository,
  now = () => new Date(), runInTransaction, eventBus = noopEventBus }) {
  async function create(input, currentUser) {
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    const current = now();
    const details = [];
    const invalid = (field, message) => details.push({ location: "body", field, message });
    if (end.getTime() <= start.getTime()) invalid("endTime", "End must be after start");
    else if (end - start < MIN_DURATION || end - start > MAX_DURATION) {
      invalid("endTime", "Duration must be between 15 minutes and 8 hours");
    }
    if (start.getTime() < current.getTime()) invalid("startTime", "Start must not be in the past");
    if (details.length) throw new ValidationError(details);

    const room = await roomsRepository.findById(input.roomId);
    if (!room) throw new NotFoundError("Room");
    if (input.participants > room.capacity) {
      throw new ConflictError("Room capacity exceeded", "ROOM_CAPACITY_EXCEEDED");
    }
    const existing = await reservationsRepository.list({ roomId: input.roomId });
    const overlaps = existing.some(item => item.status === "CONFIRMED" &&
      start.getTime() <= new Date(item.endTime).getTime() &&
      new Date(item.startTime).getTime() < end.getTime());
    if (overlaps) throw new ConflictError("Room already booked", "ROOM_ALREADY_BOOKED");

    return reservationsRepository.create({
      ...input, userId: currentUser.id, startTime: start, endTime: end, status: "CONFIRMED",
      createdAt: current, cancelledAt: null, internalNote: "created via API v2"
    });
  }

  async function cancel(id, currentUser) {
    const item = await reservationsRepository.findById(id);
    if (!item || (item.userId !== currentUser.id && currentUser.role !== "ADMIN"))
      throw new NotFoundError("Reservation");
    if (item.status === "CANCELLED") return item;
    const current = now();
    if (new Date(item.startTime).getTime() <= current.getTime()) {
      throw new ConflictError("Reservation already started", "RESERVATION_ALREADY_STARTED");
    }
    if (!ALLOWED_TRANSITIONS[item.status]?.includes("CANCELLED")) {
      throw new ConflictError("Invalid status transition", "INVALID_STATUS_TRANSITION");
    }
    return reservationsRepository.cancel(id, current);
  }

  async function getById(id, currentUser) {
    const item = await reservationsRepository.findById(id);
    if (!item || (item.userId !== currentUser.id && currentUser.role !== "ADMIN"))
      throw new NotFoundError("Reservation");
    return item;
  }
  const createAtomic = async (input, currentUser) => {
    const item = runInTransaction ? await runInTransaction(async repositories => {
      await repositories.roomsRepository.lockById(input.roomId);
      return createReservationsService({ ...repositories, now }).create(input, currentUser);
    }) : await create(input, currentUser);
    // Awaiting the Unit of Work above includes COMMIT.
    eventBus.publish("reservation.created", {
      reservationId: item.id, roomId: item.roomId, userId: item.userId,
      startTime: item.startTime, endTime: item.endTime
    });
    return item;
  };
  const cancelAtomic = async (id, currentUser) => {
    let changed = false;
    const operation = async repositories => {
      await repositories.reservationsRepository.lockById(id);
      const before = await repositories.reservationsRepository.findById(id);
      const item = await createReservationsService({ ...repositories, now }).cancel(id, currentUser);
      changed = before?.status !== "CANCELLED";
      return item;
    };
    let item;
    if (runInTransaction) item = await runInTransaction(operation);
    else {
      const before = await reservationsRepository.findById(id);
      item = await cancel(id, currentUser);
      changed = before?.status !== "CANCELLED";
    }
    if (changed) eventBus.publish("reservation.cancelled", {
      reservationId: item.id, roomId: item.roomId,
      userId: item.userId, cancelledBy: currentUser.id
    });
    return item;
  };
  return { create: createAtomic, cancel: cancelAtomic, getById, list: (filters, currentUser) => {
    if (currentUser.role !== "ADMIN" && filters.userId !== undefined)
      throw new ForbiddenError();
    return reservationsRepository.list(currentUser.role === "ADMIN" ? filters :
      { ...filters, userId: currentUser.id });
  } };
}
module.exports = { createReservationsService, ALLOWED_TRANSITIONS };
