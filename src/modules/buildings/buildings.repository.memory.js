function createBuildingsRepository({roomsRepository}={}) {
 const buildings=[{id:1,name:"Budynek A",address:"Adres A"},{id:2,name:"Budynek B",address:"Adres B"}];
 let nextId=3;
 return {async list(){const rooms=await roomsRepository.list();return buildings.map(x=>({...x,roomsCount:rooms.filter(y=>y.buildingId===x.id).length}));},
 async findById(id){return structuredClone(buildings.find(x=>x.id===id)??null);},
 async create(x){if(buildings.some(b=>b.name===x.name))throw Object.assign(new Error("Duplicate"),{code:"23505"});const b={...x,id:nextId++};buildings.push(b);return structuredClone(b);}};
}module.exports={createBuildingsRepository};
