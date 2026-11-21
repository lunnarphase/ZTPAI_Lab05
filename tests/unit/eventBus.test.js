const { createEventBus } = require("../../src/events/eventBus");
test.each([false, true])("listener failure is isolated, async=%s", async asynchronous => {
  const logger = { error: jest.fn() };
  const bus = createEventBus(logger);
  const next = jest.fn();
  bus.subscribe("event", asynchronous ? async () => { throw Error("audit unavailable"); }
    : () => { throw Error("audit unavailable"); });
  bus.subscribe("event", next);
  expect(() => bus.publish("event", { id: 1 })).not.toThrow();
  await bus.drain();
  expect(logger.error).toHaveBeenCalledWith("[event:event] handler failed", "audit unavailable");
  expect(next).toHaveBeenCalledTimes(1);
});
