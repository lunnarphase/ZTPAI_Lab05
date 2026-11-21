const columns = ["r.id","r.name","r.capacity","r.building_id","b.name as building_name"];
const toRoom = x => x ? {id:x.id,name:x.name,capacity:x.capacity,buildingId:x.building_id,
  building:{id:x.building_id,name:x.building_name}} : null;
function createRoomsRepository(db) {
  const base=()=>db("rooms as r").join("buildings as b","r.building_id","b.id").select(columns);
  return {
    async list() { return (await base().orderBy("r.id")).map(toRoom); },
    async findById(id) { return toRoom(await base().where("r.id",id).first()); },
    async listByBuilding(id) {return (await base().where("r.building_id",id).orderBy("r.id")).map(toRoom);},
    async lockById(id) { await db("rooms").where({id}).forUpdate().first(); },
    async update(id, input) {
      const row = { name: input.name, capacity: input.capacity, building_id: input.buildingId };
      await db("rooms").where({id}).update(row);
      return this.findById(id);
    },
    async remove(id) { return db("rooms").where({id}).del(); },
    async create(x) {
      const [row]=await db("rooms").insert({name:x.name,capacity:x.capacity,building_id:x.buildingId}).returning("id");
      return this.findById(row.id);
    }
  };
}
module.exports={createRoomsRepository};
