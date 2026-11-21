const authorize = require("../../middleware/authorize");
const {Router}=require("express");const validate=require("../../middleware/validate");
const {body,params}=require("./buildings.schemas");const {z}=require("zod");const query=z.object({}).strict();
function createBuildingsRouter(c){const r=Router();
 r.get("/",validate({query}),c.list);r.get("/:id",validate({params,query}),c.getById);
 r.get("/:id/rooms",validate({params,query}),c.rooms);r.post("/",authorize("ADMIN"),validate({body,query}),c.create);r.use((req,res,next)=>{if(["POST","PATCH","DELETE"].includes(req.method)) return authorize("ADMIN")(req,res,next);next();});r.patch("/:id",authorize("ADMIN"),validate({params:params,body:body}),c.update);
 r.delete("/:id",authorize("ADMIN"),validate({params:params}),c.remove);
 return r;}
module.exports={createBuildingsRouter};
