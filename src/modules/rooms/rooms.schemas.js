const { z } = require("zod");
const idParams = z.object({ id: z.coerce.number().int().positive() }).strict();
const emptyQuery = z.object({}).strict();
module.exports = { idParams, emptyQuery };

module.exports.createBody = z.object({buildingId:z.number().int().positive(),name:z.string().trim().min(1).max(100),capacity:z.number().int().positive()}).strict();
