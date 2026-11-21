function createInMemoryRepositories({ rooms = [], reservations = [] } = {}) {
  const roomRows = structuredClone(rooms);
  const rows = structuredClone(reservations);
  let nextId = Math.max(0, ...rows.map(r => r.id)) + 1;
  const copy = x => x ? structuredClone(x) : null;
  const repositories = {
    roomsRepository: {
      async lockById() {},
      async findById(id) { return copy(roomRows.find(x => x.id === id)); }
    },
    reservationsRepository: {
      async lockById() {},
      async findById(id) { return copy(rows.find(x => x.id === id)); },
      async list(f = {}) {
        return structuredClone(rows.filter(x => f.roomId === undefined || x.roomId === f.roomId));
      },
      async create(input) { const row = { ...copy(input), id: nextId++ }; rows.push(row); return copy(row); },
      async cancel(id, date) {
        const row = rows.find(x => x.id === id);
        row.status = "CANCELLED"; row.cancelledAt = new Date(date); return copy(row);
      }
    }
  };
  return { ...repositories, runInTransaction: async fn => fn(repositories) };
}
module.exports = { createInMemoryRepositories };
