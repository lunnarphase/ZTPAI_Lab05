const map = row => row ? { id: row.id, email: row.email,
  passwordHash: row.password_hash, role: row.role, createdAt: row.created_at } : null;
function createUsersRepository(db) {
  return {
    async findById(id) { return map(await db("users").where({ id }).first()); },
    async findByEmail(email) {
      return map(await db("users").where({ email }).first());
    },
    async create({ email, passwordHash, role }) {
      const [row] = await db("users").insert({ email, password_hash: passwordHash, role })
        .returning("*");
      return map(row);
    }
  };
}
module.exports = { createUsersRepository };
