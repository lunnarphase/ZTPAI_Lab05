function registerListeners({ eventBus, auditRepository, usersRepository, logger = console }) {
  for (const name of ["reservation.created", "reservation.cancelled"])
    eventBus.subscribe(name, event => auditRepository.append(event));
  eventBus.subscribe("reservation.cancelled", async ({ payload }) => {
    if (payload.cancelledBy === payload.userId) return;
    const actor = await usersRepository.findById(payload.cancelledBy);
    if (actor?.role !== "ADMIN") return;
    const owner = await usersRepository.findById(payload.userId);
    if (owner) logger.log(`[notification] to: ${owner.email} reservation ${payload.reservationId} cancelled by ADMIN`);
  });
}
module.exports = { registerListeners };
