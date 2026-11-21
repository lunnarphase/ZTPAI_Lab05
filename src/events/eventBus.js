const { EventEmitter } = require("node:events");
const noopEventBus = { publish() {}, subscribe() {}, async drain() {} };
function createEventBus(logger = console) {
  const emitter = new EventEmitter();
  const pending = new Set();
  return {
    publish(name, payload) {
      emitter.emit(name, { name, payload, occurredAt: new Date().toISOString() });
    },
    subscribe(name, handler) {
      const listener = event => {
        const job = Promise.resolve().then(() => handler(event))
          .catch(error => logger.error(`[event:${name}] handler failed`, error.message));
        pending.add(job);
        job.finally(() => pending.delete(job));
      };
      emitter.on(name, listener);
      return () => emitter.off(name, listener);
    },
    async drain() { while (pending.size) await Promise.all([...pending]); }
  };
}
module.exports = { createEventBus, noopEventBus };
