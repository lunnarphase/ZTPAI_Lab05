const fs=require('node:fs');const root=process.cwd();
const config=require(root+'/src/config');const db=require(root+'/src/db/knex');
const {createApp}=require(root+'/src/app');const {createRepositories,createUnitOfWork}=require(root+'/src/db/repositories.knex');
const {createUsersRepository}=require(root+'/src/modules/auth/users.repository.knex');const {createEventBus}=require(root+'/src/events/eventBus');
const request=require(root+'/node_modules/supertest');const jwt=require(root+'/node_modules/jsonwebtoken');
(async()=>{
 const eventBus=createEventBus();eventBus.subscribe('reservation.created',()=>{throw Error('temporary audit listener failure')});
 const app=createApp({config,...createRepositories(db),usersRepository:createUsersRepository(db),runInTransaction:createUnitOfWork(db),eventBus});
 const token=jwt.sign({role:'USER'},config.JWT_SECRET,{subject:'2',algorithm:'HS256',expiresIn:'15m'});
 const response=await request(app).post('/api/reservations').set('Authorization','Bearer '+token)
 .send({roomId:5,participants:2,startTime:'2027-02-16T10:00:00Z',endTime:'2027-02-16T11:00:00Z'});
 await eventBus.drain();console.log('POST /api/reservations ->',response.status);console.log('Persisted reservation:',response.body.id);
 if(response.status!==201)throw Error(JSON.stringify(response.body));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.destroy());
