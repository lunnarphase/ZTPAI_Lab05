exports.up = async db => {
  await db.schema.createTable("users", t => {
    t.increments("id");
    t.string("email", 254).notNullable().unique();
    t.string("password_hash", 100).notNullable();
    t.string("role", 20).notNullable().defaultTo("USER");
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(db.fn.now());
    t.check("role IN ('USER', 'ADMIN')");
  });
};
exports.down = db => db.schema.dropTable("users");
