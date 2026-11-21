function createReservationsRepository({ demoSeed = false } = {}) {
  // Seed dokumentuje rezerwacje utworzona przed rozpoczeciem jej terminu.
  const reservations = demoSeed ? [{
    id: 1, roomId: 4, reservedBy: "Rezerwacja startowa", participants: 4,
    startTime: new Date("2026-10-01T10:00:00Z"),
    endTime: new Date("2026-10-01T11:00:00Z"), status: "CONFIRMED",
    createdAt: new Date("2026-09-30T08:00:00Z"), cancelledAt: null,
    internalNote: "seed: reservation already started"
  }] : [];
  let nextId = Math.max(0, ...reservations.map(item => item.id)) + 1;
  return {
    async findById(id) {
      return structuredClone(reservations.find(item => item.id === id) ?? null);
    },
    async list({ roomId } = {}) {
      return structuredClone(reservations.filter(item =>
        roomId === undefined || item.roomId === roomId));
    },
    async create(data) {
      const reservation = { ...structuredClone(data), id: nextId++ };
      reservations.push(reservation);
      return structuredClone(reservation);
    },
    async cancel(id, cancelledAt) {
      const item = reservations.find(item => item.id === id);
      item.status = "CANCELLED";
      item.cancelledAt = new Date(cancelledAt);
      return structuredClone(item);
    }
  };
}
module.exports = { createReservationsRepository };

const createOriginal = createReservationsRepository;
module.exports.createReservationsRepository = function({roomsRepository,...options}={}) {
 const repo=createOriginal(options);
 const hydrate=async x=>x?{...x,...(roomsRepository?{room:await roomsRepository.findById(x.roomId)}:{})}:null;
 return {...repo,async lockById(){},
  async findById(id){return hydrate(await repo.findById(id));},
  async create(x){return hydrate(await repo.create(x));},
  async cancel(id,date){return hydrate(await repo.cancel(id,date));},
  async list(f={}){
   let rows=await Promise.all((await repo.list(f)).map(hydrate));
   rows=rows.filter(x=>(!f.buildingId||x.room.buildingId===f.buildingId)&&(!f.status||x.status===f.status)&&(!f.from||new Date(x.endTime)>new Date(f.from))&&(!f.to||new Date(x.startTime)<new Date(f.to)));
   if(!f.page)return rows;
   const key=f.sort.replace(/^-/,""),direction=f.sort.startsWith("-")?-1:1;
   rows.sort((a,b)=>{const av=key==="participants"?a[key]:new Date(a[key]).getTime(),bv=key==="participants"?b[key]:new Date(b[key]).getTime();return (av-bv)*direction||a.id-b.id;});
   return {total:rows.length,items:rows.slice((f.page-1)*f.limit,f.page*f.limit)};
  }
 };
};
