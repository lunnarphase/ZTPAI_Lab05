const { createRoomsRepository } = require("../modules/rooms/rooms.repository.knex");
const { createReservationsRepository } = require("../modules/reservations/reservations.repository.knex");
const { createBuildingsRepository } = require("../modules/buildings/buildings.repository.knex");
function createRepositories(db) {
  return {roomsRepository:createRoomsRepository(db),
    reservationsRepository:createReservationsRepository(db),
    buildingsRepository:createBuildingsRepository(db)};
}
function createUnitOfWork(db) {
  return callback => db.transaction(trx => callback(createRepositories(trx)));
}
module.exports={createRepositories,createUnitOfWork};
