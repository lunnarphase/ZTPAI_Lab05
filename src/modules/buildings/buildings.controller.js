const {toBuildingResponse:map}=require("./buildings.mapper");
const {toRoomResponse}=require("../rooms/rooms.mapper");
function createBuildingsController(s){return {
    async update(req,res) { res.json(map(await s.update(req.validated.params.id,req.validated.body))); },
    async remove(req,res) { await s.remove(req.validated.params.id);res.status(204).end(); },
 async list(req,res){res.json((await s.list()).map(map));},
 async getById(req,res){res.json(map(await s.getById(req.validated.params.id)));},
 async create(req,res){const x=await s.create(req.validated.body);res.location(`/api/buildings/${x.id}`).status(201).json(map(x));},
 async rooms(req,res){res.json((await s.rooms(req.validated.params.id)).map(toRoomResponse));}
};}module.exports={createBuildingsController};
