const { toReservationResponse } = require("./reservations.mapper");
function createReservationsController(service) {
  return {
    async create(req, res) {
      const item = await service.create(req.validated.body, req.user);
      res.location(`/api/reservations/${item.id}`).status(201)
        .json(toReservationResponse(item));
    },
    async list(req, res) {
      const f=req.validated.query; const result=await service.list(f, req.user);
      res.json({data:result.items.map(toReservationResponse),meta:{page:f.page,limit:f.limit,total:result.total,totalPages:Math.ceil(result.total/f.limit)}});
    },
    async getById(req, res) {
      res.json(toReservationResponse(await service.getById(req.validated.params.id, req.user)));
    },
    async cancel(req, res) {
      res.json(toReservationResponse(await service.cancel(req.validated.params.id, req.user)));
    }
  };
}
module.exports = { createReservationsController };
