function toRoomResponse(x){return {id:x.id,name:x.name,capacity:x.capacity,
 ...(x.building?{building:{id:x.building.id,name:x.building.name}}:{})};}
module.exports={toRoomResponse};
