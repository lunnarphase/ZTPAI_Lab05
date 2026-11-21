const {z}=require("zod");
module.exports={body:z.object({name:z.string().trim().min(1).max(100),address:z.string().trim().min(1).max(200)}).strict(),
 params:z.object({id:z.coerce.number().int().positive()}).strict()};
