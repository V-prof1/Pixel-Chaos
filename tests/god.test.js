import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {Battle} from '../dist/sim.js';
import {TYPES,unitCost} from '../dist/catalog.js';
import {WORLD} from '../dist/world.js';
import {validFormation,placeGroup} from '../dist/formation.js';
import {CrowdRenderer,ProjectileRenderer} from '../dist/crowd.js';
const formation=(type,god=false)=>[{type,god,team:'blue',x:-3,z:0},{type:'saitama',team:'red',x:3,z:0}];
test('GOD ranged attacks create exactly 100 times as many independent projectiles',()=>{
 for(const type of ['goku','vegeta','spiderman','ironman','harry']){
  const normal=new Battle(formation(type)),god=new Battle(formation(type,true));
  normal.cast(normal.units[0],normal.units[1],normal.units);god.cast(god.units[0],god.units[1],god.units);
  assert.equal(god.projectiles.length,normal.projectiles.length*100,type);
  assert.equal(new Set(god.projectiles.map(p=>p.id)).size,god.projectiles.length);
 }
});
test('projectiles travel before applying damage and GOD shots resolve individually',()=>{
 const sim=new Battle(formation('goku',true));const [u,v]=sim.units;sim.shoot(u,v,1);assert.equal(sim.projectiles.length,100);assert.equal(v.hp,v.maxHp);
 for(let i=0;i<150;i++)sim.updateProjectiles(1/60);
 assert.ok(v.hp<v.maxHp-90);assert.equal(sim.projectiles.length,0);
});
test('GOD melee gives exactly 100x impulse and reduces incoming damage by 10',()=>{
 const normal=new Battle(formation('luffy')),god=new Battle(formation('luffy',true));
 normal.damage(normal.units[1],10,normal.units[0]);god.damage(god.units[1],10,god.units[0]);assert.equal(god.units[1].vx,normal.units[1].vx*100);
 const hp=god.units[0].hp;god.damage(god.units[0],100,god.units[1]);assert.equal(hp-god.units[0].hp,10);
});
test('GOD explosions have 100x damage and 10x radius, reaching beyond the old map',()=>{
 const a=new Battle(formation('bakugo')),b=new Battle(formation('bakugo',true));
 a.blast(a.units[0],3,0,4,1);b.blast(b.units[0],3,0,4,1);assert.equal(a.units[1].maxHp-a.units[1].hp,1);assert.equal(b.units[1].maxHp-b.units[1].hp,100);
 a.units[1].x=b.units[1].x=30;const ah=a.units[1].hp,bh=b.units[1].hp;a.blast(a.units[0],0,0,4,1);b.blast(b.units[0],0,0,4,1);assert.equal(a.units[1].hp,ah);assert.equal(b.units[1].hp,bh-100);
});
test('support and control GOD modifiers change actual recovery and status duration',()=>{
 const heal=new Battle([{type:'yoda',god:true,team:'blue',x:-3,z:0},{type:'saitama',team:'blue',x:-30,z:0},{type:'luffy',team:'red',x:2,z:0}]);heal.units[1].hp=1;heal.cast(heal.units[0],heal.units[2],heal.units);assert.equal(heal.units[1].hp,heal.units[1].maxHp);
 const control=new Battle(formation('wednesday',true));control.cast(control.units[0],control.units[1],control.units);assert.equal(control.units[1].slow,200);
});
test('large formations persist without truncation and batch placement obeys map/team/budget',()=>{
 const f=[];const first=placeGroup(f,{type:'goku',team:'blue',x:-15,z:0,amount:500,god:true});assert.equal(first.added,500);assert.equal(validFormation(JSON.parse(JSON.stringify(f))).length,500);assert.ok(f.every(u=>u.god&&u.x<0&&Math.abs(u.z)<=WORLD.halfZ));
 const second=placeGroup(f,{type:'vader',team:'red',x:15,z:0,amount:500});assert.equal(second.added,500);assert.equal(validFormation(f).length,1000);
 const campaign=[];placeGroup(campaign,{type:'luffy',team:'blue',x:-3,z:0,god:true,amount:100,budget:unitCost('luffy',true)});assert.equal(campaign.length,1);
});
test('1000 units simulate and render in instanced batches without dropping units',()=>{
 const f=[];placeGroup(f,{type:'saitama',team:'blue',x:-12,z:0,amount:500,god:true});placeGroup(f,{type:'luffy',team:'red',x:12,z:0,amount:500});
 const sim=new Battle(f,()=>{},()=>.5);for(let i=0;i<20;i++)sim.step(1/60);assert.equal(sim.units.length,1000);assert.ok(sim.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.hp)));
 const scene=new T.Scene(),crowd=new CrowdRenderer(scene,f);crowd.sync(sim.units,1);assert.equal(crowd.meshes.reduce((n,g)=>n+g.mesh.count,0),1000);assert.equal(crowd.markers.count,1000);assert.equal(crowd.halos.count,500);assert.ok(crowd.meshes.every(g=>Array.from(g.mesh.instanceMatrix.array).every(Number.isFinite)));crowd.dispose();
 const renderer=new ProjectileRenderer(scene);renderer.sync(Array.from({length:5000},(_,i)=>({x:i%10,z:i%20,color:0xabcdef,delay:0,id:i})));assert.equal(renderer.points.geometry.drawRange.count,5000);
});
test('extended arena bounds clamp huge impulses and imported saves retain legacy units',()=>{
 const f=validFormation([{type:'goku',team:'blue',x:-4,z:0},{type:'naruto',team:'red',x:4,z:0}]);assert.equal(f.length,2);assert.equal(f[0].god,false);
 const sim=new Battle(f);sim.units[0].vx=1e6;sim.units[1].vz=-1e6;sim.step(1/60);assert.ok(sim.units.every(u=>Math.abs(u.x)<=WORLD.halfX&&Math.abs(u.z)<=WORLD.halfZ));
});
test('every new character can join the same crowd without invalid instance transforms',()=>{
 const f=Object.keys(TYPES).map((type,i)=>({type,god:true,team:i%2?'blue':'red',x:i-10,z:0}));const crowd=new CrowdRenderer(new T.Scene(),f);crowd.sync(f,1);assert.equal(crowd.meshes.length,20);assert.ok(crowd.meshes.every(g=>Array.from(g.mesh.instanceMatrix.array).every(Number.isFinite)));crowd.dispose();
});
test('hybrid GOD characters receive every applicable modifier',()=>{
 for(const [type,d]of Object.entries(TYPES))if(d.range>3){const normal=new Battle(formation(type)),god=new Battle(formation(type,true));normal.shoot(normal.units[0],normal.units[1],1);god.shoot(god.units[0],god.units[1],1);assert.equal(god.projectiles.length,normal.projectiles.length*100,type);}
 const naruto=new Battle(formation('naruto',true)).units[0];assert.equal(naruto.mods.defense,10);assert.equal(naruto.mods.knockback,100);assert.equal(naruto.mods.blast,100);
 const gojo=new Battle(formation('gojo',true)).units[0];assert.equal(gojo.mods.projectiles,100);assert.equal(gojo.mods.blast,100);
});
