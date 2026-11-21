const map=x=>x?{id:x.id,name:x.name,address:x.address,...(x.rooms_count!==undefined?{roomsCount:Number(x.rooms_count)}:{})}:null;
function createBuildingsRepository(db) {return {
  async list(){return (await db("buildings as b").leftJoin("rooms as r","r.building_id","b.id")
    .select("b.id","b.name","b.address").count({rooms_count:"r.id"}).groupBy("b.id").orderBy("b.id")).map(map);},
  async findById(id){return map(await db("buildings").where({id}).first());},
  async update(id, input) {
      const row = { name: input.name, address: input.address };
      await db("buildings").where({id}).update(row);
      return this.findById(id);
    },
    async remove(id) { return db("buildings").where({id}).del(); },
    async create(x){return map((await db("buildings").insert(x).returning("*"))[0]);}
};}
module.exports={createBuildingsRepository};
