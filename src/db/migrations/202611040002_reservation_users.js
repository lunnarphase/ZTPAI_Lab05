const bcrypt = require("bcryptjs");
const { randomBytes } = require("node:crypto");
exports.up = async db => {
  await db.schema.alterTable("reservations", t => {
    t.integer("user_id").references("id").inTable("users").onDelete("RESTRICT");
  });
  const legacy = await db("reservations").select("id");
  if (legacy.length) {
    // An unknown random password prevents login as the legacy account.
    const [owner] = await db("users").insert({
      email: "legacy@migration.invalid", role: "USER",
      password_hash: await bcrypt.hash(randomBytes(48).toString("hex"), 12)
    }).returning("id");
    await db("reservations").update({ user_id: owner.id });
  }
  await db.schema.alterTable("reservations", t => {
    t.integer("user_id").notNullable().alter();
    t.dropColumn("reserved_by");
    t.index(["user_id", "start_time"]);
  });
};
exports.down = async db => {
  await db.schema.alterTable("reservations", t => t.string("reserved_by", 100));
  await db.raw(`UPDATE reservations r SET reserved_by = u.email
    FROM users u WHERE r.user_id = u.id`);
  await db.schema.alterTable("reservations", t => {
    t.string("reserved_by", 100).notNullable().alter();
    t.dropColumn("user_id");
  });
};
