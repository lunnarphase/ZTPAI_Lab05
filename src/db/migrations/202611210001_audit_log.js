exports.up = db => db.schema.createTable("audit_log", t => {
  t.bigIncrements("id");
  t.string("event_type", 100).notNullable();
  t.jsonb("payload").notNullable();
  t.timestamp("created_at", { useTz: true }).notNullable();
  t.index(["event_type", "created_at"]);
});
exports.down = db => db.schema.dropTable("audit_log");
