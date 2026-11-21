const isoOrNull = value => value == null ? null : new Date(value).toISOString();
function toReservationResponse(item) {
  return {
    id: item.id,
    ...(item.room?{room:{id:item.room.id,name:item.room.name,building:{id:item.room.building.id,name:item.room.building.name}}}:{roomId:item.roomId}),
    user: item.user,
    participants: item.participants,
    startTime: isoOrNull(item.startTime),
    endTime: isoOrNull(item.endTime),
    status: item.status,
    createdAt: isoOrNull(item.createdAt),
    cancelledAt: isoOrNull(item.cancelledAt)
  };
}
module.exports = { toReservationResponse };
