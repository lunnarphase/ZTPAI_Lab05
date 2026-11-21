const { NotFoundError } = require("../../errors/AppError");
function createRoomsService({ roomsRepository, buildingsRepository }) {
  return {
    async update(id, input) {
      if (!await roomsRepository.findById(id)) throw new NotFoundError("rooms");
      if (!await buildingsRepository.findById(input.buildingId)) throw new NotFoundError("Building");
      return roomsRepository.update(id, input);
    },
    async remove(id) {
      if (!await roomsRepository.findById(id)) throw new NotFoundError("rooms");
      await roomsRepository.remove(id);
    },
    async create(input) {
      if (!await buildingsRepository.findById(input.buildingId)) throw new NotFoundError("Building");
      return roomsRepository.create(input);
    },
    async list() { return roomsRepository.list(); },
    async getById(id) {
      const room = await roomsRepository.findById(id);
      if (!room) throw new NotFoundError("Room");
      return room;
    }
  };
}
module.exports = { createRoomsService };
