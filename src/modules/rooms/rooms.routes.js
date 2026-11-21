const authorize = require("../../middleware/authorize");
const { Router } = require("express");
const validate = require("../../middleware/validate");
const { idParams, emptyQuery } = require("./rooms.schemas");
function createRoomsRouter(controller) {
  const router = Router();
  router.post("/", authorize("ADMIN"),authorize("ADMIN"), validate({body:require("./rooms.schemas").createBody}), controller.create);
  router.get("/", validate({ query: emptyQuery }), controller.list);
  router.get("/:id", validate({ params: idParams, query: emptyQuery }), controller.getById);
  router.use((req,res,next)=>{if(["POST","PATCH","DELETE"].includes(req.method)) return authorize("ADMIN")(req,res,next);next();});router.patch("/:id",authorize("ADMIN"),validate({params:idParams,body:require("./rooms.schemas").createBody}),controller.update);
 router.delete("/:id",authorize("ADMIN"),validate({params:idParams}),controller.remove);
 return router;
}
module.exports = { createRoomsRouter };
