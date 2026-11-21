const bcrypt = require("bcryptjs");
exports.seed = async db => {
  const createdAt = "2026-09-30T08:00:00Z";
  await db.transaction(async trx => {
    await trx.raw("TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY");
    await trx("users").insert(await Promise.all([
      {email:"admin@example.com",role:"ADMIN"},
      {email:"anna@example.com",role:"USER"},
      {email:"jan@example.com",role:"USER"}
    ].map(async u => ({...u,password_hash:await bcrypt.hash("demo-password-123",12),created_at:createdAt}))));
    await trx("buildings").insert([
      { name: "Budynek A", address: "ul. Warszawska 24, Kraków" },
      { name: "Budynek B", address: "ul. Podchorążych 1, Kraków" }
    ].map(row => ({ ...row, created_at: createdAt })));
    await trx("rooms").insert([
      { building_id: 1, name: "101", capacity: 30 },
      { building_id: 1, name: "102", capacity: 15 },
      { building_id: 1, name: "103", capacity: 20 },
      { building_id: 2, name: "101", capacity: 50 },
      { building_id: 2, name: "202", capacity: 8 }
    ].map(row => ({ ...row, created_at: createdAt })));
    await trx("reservations").insert([
      { room_id: 1, start_time: "2026-12-10T10:00Z",
        end_time: "2026-12-10T12:00Z" },
      { room_id: 1, start_time: "2026-12-10T12:00Z",
        end_time: "2026-12-10T13:00Z" },
      { room_id: 2, start_time: "2026-12-10T10:00Z",
        end_time: "2026-12-10T12:00Z" },
      { room_id: 3, start_time: "2026-12-10T10:00Z",
        end_time: "2026-12-10T12:00Z", status: "CANCELLED",
        cancelled_at: "2026-11-01T09:00Z" },
      { room_id: 5, start_time: "2026-10-01T10:00Z",
        end_time: "2026-10-01T12:00Z" }
    ].map(row => ({
      user_id: 2, participants: 5, status: "CONFIRMED",
      created_at: createdAt, internal_note: "seed Lab03", ...row
    })));
  });
};
