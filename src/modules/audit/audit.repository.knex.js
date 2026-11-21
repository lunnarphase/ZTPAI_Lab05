function createAuditRepository(db) {
  return {
    async append(event) {
      await db("audit_log").insert({ event_type: event.name,
        payload: event.payload, created_at: event.occurredAt });
    },
    async list({ page, limit, eventType }) {
      const query = db("audit_log");
      if (eventType) query.where("event_type", eventType);
      const [rows, count] = await Promise.all([
        query.clone().orderBy("created_at", "desc").orderBy("id", "desc")
          .limit(limit).offset((page - 1) * limit),
        query.clone().count("* as total").first()
      ]);
      return { data: rows.map(row => ({ id: Number(row.id), eventType: row.event_type,
        payload: row.payload, createdAt: row.created_at })),
        meta: { page, limit, total: Number(count.total),
          totalPages: Math.ceil(Number(count.total) / limit) } };
    }
  };
}
module.exports = { createAuditRepository };
