const { toRoomResponse } = require("./rooms.mapper");
function createRoomsController(service) {
  return {
    async update(req,res) { res.json(toRoomResponse(await service.update(req.validated.params.id,req.validated.body))); },
    async remove(req,res) { await service.remove(req.validated.params.id);res.status(204).end(); },
    async create(req,res) { const x=await service.create(req.validated.body); res.location(`/api/rooms/${x.id}`).status(201).json(toRoomResponse(x)); },
    async list(req, res) { res.json((await service.list()).map(toRoomResponse)); },
    async getById(req, res) {
      res.json(toRoomResponse(await service.getById(req.validated.params.id)));
    }
  };
}
module.exports = { createRoomsController };
