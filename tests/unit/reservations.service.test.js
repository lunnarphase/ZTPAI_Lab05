const { createReservationsService } = require("../../src/modules/reservations/reservations.service");
const { createInMemoryRepositories } = require("../../src/db/repositories.memory");
const NOW = new Date("2026-12-01T08:00:00Z");
const owner = { id: 2, role: "USER" };
const foreign = { id: 3, role: "USER" };
const admin = { id: 1, role: "ADMIN" };
const input = (start = "10:00", end = "11:00", extra = {}) => ({ roomId: 1,
  participants: 5, startTime: `2026-12-02T${start}:00Z`,
  endTime: `2026-12-02T${end}:00Z`, ...extra });
const row = extra => ({ ...input(), id: 1, userId: 2, status: "CONFIRMED",
  startTime: new Date("2026-12-02T10:00:00Z"),
  endTime: new Date("2026-12-02T11:00:00Z"), cancelledAt: null, ...extra });
function setup(rows = [], txDecorator = fn => fn) {
  const repos = createInMemoryRepositories({ rooms: [
    { id: 1, capacity: 10 }, { id: 2, capacity: 10 }
  ], reservations: rows });
  const eventBus = { publish: jest.fn() };
  const service = createReservationsService({ ...repos, eventBus, now: () => new Date(NOW),
    runInTransaction: txDecorator(repos.runInTransaction) });
  return { service, eventBus, repos };
}
describe("Reservation rules", () => {
  test.each([["09:30", "10:30"], ["10:30", "11:30"], ["09:00", "12:00"],
    ["10:15", "10:45"]])("rejects overlap %s-%s", async (a, b) => {
    const { service, eventBus } = setup([row()]);
    await expect(service.create(input(a, b), owner))
      .rejects.toMatchObject({ code: "ROOM_ALREADY_BOOKED" });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
  test.each([["09:00", "10:00"], ["11:00", "12:00"]])("allows touching %s-%s", async (a, b) => {
    await expect(setup([row()]).service.create(input(a, b), owner))
      .resolves.toMatchObject({ status: "CONFIRMED" });
  });
  test("allows identical interval in another room", async () => {
    await expect(setup([row()]).service.create(input("10:00", "11:00", { roomId: 2 }), owner))
      .resolves.toMatchObject({ roomId: 2 });
  });
  test("cancelled reservation does not block", async () => {
    await expect(setup([row({ status: "CANCELLED" })]).service.create(input(), owner))
      .resolves.toMatchObject({ status: "CONFIRMED" });
  });
  test("capacity equality is allowed", async () => {
    await expect(setup().service.create(input("10:00", "11:00", { participants: 10 }), owner))
      .resolves.toMatchObject({ participants: 10 });
  });
  test("capacity plus one rejected", async () => {
    await expect(setup().service.create(input("10:00", "11:00", { participants: 11 }), owner))
      .rejects.toMatchObject({ code: "ROOM_CAPACITY_EXCEEDED" });
  });
  test.each([["10:15", true], ["18:00", true], ["10:14", false], ["18:01", false]])(
    "duration 10:00-%s allowed=%s", async (end, allowed) => {
      const { service } = setup();
      const result = service.create(input("10:00", end), owner);
      if (allowed) await expect(result).resolves.toMatchObject({ userId: owner.id });
      else await expect(result).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });
  test("started reservation cannot be cancelled", async () => {
    const { service } = setup([row({ startTime: NOW })]);
    await expect(service.cancel(1, owner)).rejects.toMatchObject({ code: "RESERVATION_ALREADY_STARTED" });
  });
  test("double cancellation preserves cancelledAt and emits once", async () => {
    const { service, eventBus } = setup([row()]);
    const first = await service.cancel(1, owner);
    const second = await service.cancel(1, owner);
    expect(second.cancelledAt).toEqual(first.cancelledAt);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });
  test("foreign USER cannot read or cancel", async () => {
    const { service, eventBus } = setup([row()]);
    await expect(service.getById(1, foreign)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.cancel(1, foreign)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
  test("ADMIN can cancel another owner's reservation", async () => {
    const { service, eventBus } = setup([row()]);
    await expect(service.cancel(1, admin)).resolves.toMatchObject({ status: "CANCELLED" });
    expect(eventBus.publish).toHaveBeenCalledWith("reservation.cancelled",
      { reservationId: 1, roomId: 1, userId: 2, cancelledBy: 1 });
  });
  test("creation event is published only after transaction commit", async () => {
    let committed = false;
    const { service, eventBus } = setup([], tx => async fn => {
      const item = await tx(fn); committed = true; return item;
    });
    eventBus.publish.mockImplementation(() => expect(committed).toBe(true));
    const item = await service.create(input(), owner);
    expect(eventBus.publish).toHaveBeenCalledWith("reservation.created",
      expect.objectContaining({ reservationId: item.id, roomId: 1, userId: 2 }));
  });
  test("transaction failure prevents creation event", async () => {
    const { service, eventBus } = setup([], () => async () => {
      throw Object.assign(new Error("rollback"), { code: "TX_FAILED" });
    });
    await expect(service.create(input(), owner)).rejects.toMatchObject({ code: "TX_FAILED" });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
