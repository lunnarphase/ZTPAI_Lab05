const SORT={startTime:"r.start_time",createdAt:"r.created_at",participants:"r.participants"};
function toReservation(x) {
  return x ? {id:x.id,roomId:x.room_id,userId:x.user_id,user:{id:x.user_id,email:x.user_email},participants:x.participants,
    startTime:x.start_time,endTime:x.end_time,status:x.status,cancelledAt:x.cancelled_at,
    createdAt:x.created_at,internalNote:x.internal_note,
    room:{id:x.room_id,name:x.room_name,building:{id:x.building_id,name:x.building_name}}}:null;
}
function createReservationsRepository(db) {
  const base=()=>db("reservations as r").join("rooms as rm","r.room_id","rm.id")
    .join("buildings as b","rm.building_id","b.id").join("users as u","r.user_id","u.id");
  const select=q=>q.select("r.*","rm.name as room_name","rm.building_id","b.name as building_name","u.email as user_email");
  return {
    async findById(id) {return toReservation(await select(base()).where("r.id",id).first());},
    async lockById(id) {await db("reservations").where({id}).forUpdate().first();},
    async list(f={}) {
      const q=base().modify(q=>{
        if(f.userId!==undefined)q.where("r.user_id",f.userId);
        if(f.roomId!==undefined)q.where("r.room_id",f.roomId);
        if(f.buildingId!==undefined)q.where("rm.building_id",f.buildingId);
        if(f.status)q.where("r.status",f.status);
        if(f.from)q.where("r.end_time",">",f.from);
        if(f.to)q.where("r.start_time","<",f.to);
      });
      if(f.page===undefined)return (await select(q).orderBy("r.id")).map(toReservation);
      const desc=f.sort.startsWith("-");const col=SORT[desc?f.sort.slice(1):f.sort];
      if(!col)throw new Error("Invalid sort column");
      const [rows,count]=await Promise.all([
        select(q.clone()).orderBy(col,desc?"desc":"asc").orderBy("r.id","asc")
          .limit(f.limit).offset((f.page-1)*f.limit),
        q.clone().count({total:"r.id"}).first()]);
      return {items:rows.map(toReservation),total:Number(count.total)};
    },
    async create(x) {
      const [row]=await db("reservations").insert({room_id:x.roomId,user_id:x.userId,
        participants:x.participants,start_time:x.startTime,end_time:x.endTime,status:x.status,
        created_at:x.createdAt,cancelled_at:x.cancelledAt,internal_note:x.internalNote}).returning("id");
      return this.findById(row.id);
    },
    async cancel(id,date) {
      await db("reservations").where({id}).update({status:"CANCELLED",cancelled_at:date});
      return this.findById(id);
    }
  };
}
module.exports={createReservationsRepository};
