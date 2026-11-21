function createRoomsRepository({ getBuilding } = {}) {
  const rooms = [
    { id: 1, name: "A101", capacity: 30 },
    { id: 2, name: "A102", capacity: 15 },
    { id: 3, name: "B201", capacity: 50 },
    { id: 4, name: "B202", capacity: 8 }
  ];
  rooms.forEach(x=>x.buildingId=x.id<=2?1:2);
  let nextId=5;
  const map=async x=>x?{...structuredClone(x),building: getBuilding?await getBuilding(x.buildingId):{id:x.buildingId,name:"Budynek "+(x.buildingId===1?"A":"B")}}:null;
  return {
    async lockById() {},
    async listByBuilding(id){return Promise.all(rooms.filter(x=>x.buildingId===id).map(map));},
    async create(input){if(rooms.some(x=>x.buildingId===input.buildingId&&x.name===input.name))throw Object.assign(new Error("Duplicate"),{code:"23505"});const x={...input,id:nextId++};rooms.push(x);return map(x);},
    async list() { return Promise.all(rooms.map(map)); },
    async findById(id) {
      return map(rooms.find(room => room.id === id));
    }
  };
}
module.exports = { createRoomsRepository };
