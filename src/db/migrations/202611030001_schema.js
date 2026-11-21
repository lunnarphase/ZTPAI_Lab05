exports.up = async db => {
  await db.schema.createTable("buildings", t => {
    t.increments("id"); t.string("name",100).notNullable().unique();
    t.string("address",200).notNullable();
    t.timestamp("created_at",{useTz:true}).notNullable().defaultTo(db.fn.now());
  });
  await db.schema.createTable("rooms", t => {
    t.increments("id"); t.integer("building_id").notNullable()
      .references("id").inTable("buildings").onDelete("RESTRICT");
    t.string("name",100).notNullable(); t.integer("capacity").notNullable();
    t.timestamp("created_at",{useTz:true}).notNullable().defaultTo(db.fn.now());
    t.unique(["building_id","name"]); t.check("capacity > 0");
  });
  await db.schema.createTable("reservations", t => {
    t.increments("id"); t.integer("room_id").notNullable()
      .references("id").inTable("rooms").onDelete("RESTRICT");
    t.string("reserved_by",100).notNullable(); t.integer("participants").notNullable();
    t.timestamp("start_time",{useTz:true}).notNullable();
    t.timestamp("end_time",{useTz:true}).notNullable();
    t.string("status",20).notNullable().defaultTo("CONFIRMED");
    t.timestamp("cancelled_at",{useTz:true});
    t.timestamp("created_at",{useTz:true}).notNullable().defaultTo(db.fn.now());
    t.text("internal_note");
    t.check("end_time > start_time");
    t.check("status IN ('CONFIRMED', 'CANCELLED')");
    t.check("participants > 0");
    t.index(["room_id","start_time","end_time"]);
  });
};
exports.down = async db => {
  await db.schema.dropTable("reservations");
  await db.schema.dropTable("rooms");
  await db.schema.dropTable("buildings");
};
