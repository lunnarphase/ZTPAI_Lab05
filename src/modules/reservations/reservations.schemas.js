const { z } = require("zod");
const idParams = z.object({ id: z.coerce.number().int().positive() }).strict();
const listQuery = z.object({
 userId:z.coerce.number().int().positive().optional(),
 roomId:z.coerce.number().int().positive().optional(),buildingId:z.coerce.number().int().positive().optional(),
 status:z.enum(["CONFIRMED","CANCELLED"]).optional(),
 from:z.iso.datetime({offset:true}).optional(),to:z.iso.datetime({offset:true}).optional(),
 page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(20),
 sort:z.enum(["startTime","-startTime","createdAt","-createdAt","participants","-participants"]).default("startTime")
}).strict().refine(x=>!x.from||!x.to||new Date(x.from)<new Date(x.to),{path:["to"],message:"to must be after from"});
const createBody = z.object({
  roomId: z.number().int().positive(),
  participants: z.number().int().positive(),
  startTime: z.iso.datetime({ offset: true }),
  endTime: z.iso.datetime({ offset: true })
}).strict();
const emptyBody = z.object({}).strict().optional();
const emptyQuery = z.object({}).strict();
module.exports = { idParams, listQuery, createBody, emptyBody, emptyQuery };
