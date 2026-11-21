function toBuildingResponse(x){return {id:x.id,name:x.name,address:x.address,
 ...(x.roomsCount!==undefined?{roomsCount:x.roomsCount}:{})};}
module.exports={toBuildingResponse};
