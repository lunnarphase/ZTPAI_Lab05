const { Router } = require("express");
const validate = require("../../middleware/validate");
const { idParams, listQuery, createBody, emptyBody, emptyQuery } = require("./reservations.schemas");
function createReservationsRouter(controller) {
  const router = Router();
  router.get("/", validate({ query: listQuery }), controller.list);
  router.get("/:id", validate({ params: idParams, query: emptyQuery }), controller.getById);
  router.post("/", validate({ body: createBody, query: emptyQuery }), controller.create);
  router.patch("/:id/cancel", validate({ params: idParams,
    query: emptyQuery, body: emptyBody }), controller.cancel);
  return router;
}
module.exports = { createReservationsRouter };
