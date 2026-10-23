import {test} from 'node:test';import assert from 'node:assert/strict';import {Battle,CHALLENGES,TYPES} from '../dist/sim.js';
const rng=()=>.5;
test('all character matchups terminate with finite bounded state',()=>{for(const a of Object.keys(TYPES))for(const b of Object.keys(TYPES)){const sim=new Battle([{type:a,team:'blue',x:-4,z:0},{type:b,team:'red',x:4,z:0}],()=>{},rng);for(let i=0;i<7300&&!sim.finished;i++)sim.step(1/60);assert.ok(sim.finished);for(const u of sim.units){assert.ok(Number.isFinite(u.x)&&Number.isFinite(u.z));assert.ok(u.hp>=0&&u.hp<=u.maxHp);}}});
test('specials fire and formation input is preserved',()=>{const f=[{type:'goku',team:'blue',x:-3,z:0},{type:'luffy',team:'red',x:3,z:0}],original=JSON.stringify(f),events=[];const sim=new Battle(f,e=>events.push(e),rng);for(let i=0;i<1200&&!sim.finished;i++)sim.step(1/60);assert.ok(events.some(e=>e.type==='special'));assert.equal(JSON.stringify(f),original);});
test('40 units and every campaign enemy formation terminate without NaN',()=>{const scenarios=[...CHALLENGES.map(c=>[{type:'goku',team:'blue',x:-4,z:0},...c.enemies.map(([type,x,z])=>({type,x,z,team:'red'}))]),Array.from({length:40},(_,i)=>({type:Object.keys(TYPES)[i%3],team:i<20?'blue':'red',x:i<20?-4:4,z:(i%10-5)*.9}))];for(const f of scenarios){const sim=new Battle(f,()=>{},rng);for(let i=0;i<7300&&!sim.finished;i++)sim.step(1/60);assert.ok(sim.finished);assert.ok(sim.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.z)&&u.hp>=0));}});
test('new control, support and protection abilities affect combat state',()=>{
 for(const [type,status]of [['vader','stun'],['spiderman','stun'],['elsa','slow'],['eleven','stun']]){
  const sim=new Battle([{type,team:'blue',x:-1,z:0},{type:'luffy',team:'red',x:1,z:0}],()=>{},rng);
  const [caster,target]=sim.units;caster.angle=Math.PI/2;sim.cast(caster,target,sim.units);assert.ok(target[status]>0,type);assert.ok(target.hp<target.maxHp);
 }
 const sim=new Battle([{type:'yoda',team:'blue',x:-1,z:0},{type:'goku',team:'blue',x:-2,z:0},{type:'luffy',team:'red',x:1,z:0}],()=>{},rng);
 const [yoda,ally,enemy]=sim.units;ally.hp-=100;yoda.angle=Math.PI/2;sim.cast(yoda,enemy,sim.units);assert.equal(ally.hp,ally.maxHp-20);
 const gojo=new Battle([{type:'gojo',team:'blue',x:-1,z:0},{type:'luffy',team:'red',x:1,z:0}],()=>{},rng);
 gojo.units[0].angle=Math.PI/2;gojo.cast(gojo.units[0],gojo.units[1],gojo.units);assert.ok(gojo.units[0].guard>0);
});
test('mixed 40-character formations finish and every special is exercised',()=>{
 const ids=Object.keys(TYPES),f=Array.from({length:40},(_,i)=>({type:ids[i%ids.length],team:i<20?'blue':'red',x:i<20?-4:4,z:(i%10-5)*.9}));
 const seen=new Set();const sim=new Battle(f,e=>{if(e.type==='special')seen.add(e.unit.type);},rng);
 for(let i=0;i<7300&&!sim.finished;i++)sim.step(1/60);
 assert.ok(sim.finished);assert.ok(seen.size>=9);assert.ok(sim.units.every(u=>Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp&&Math.abs(u.x)<=11&&Math.abs(u.z)<=7));
});
