const {NotFoundError}=require("../../errors/AppError");
function createBuildingsService({buildingsRepository,roomsRepository}) {return {
    async update(id, input) {
      if (!await buildingsRepository.findById(id)) throw new NotFoundError("buildings");
      return buildingsRepository.update(id, input);
    },
    async remove(id) {
      if (!await buildingsRepository.findById(id)) throw new NotFoundError("buildings");
      await buildingsRepository.remove(id);
    },
  list:()=>buildingsRepository.list(),
  async getById(id){const x=await buildingsRepository.findById(id);if(!x)throw new NotFoundError("Building");return x;},
  create:x=>buildingsRepository.create(x),
  async rooms(id){if(!await buildingsRepository.findById(id))throw new NotFoundError("Building");return roomsRepository.listByBuilding(id);}
};}
module.exports={createBuildingsService};
