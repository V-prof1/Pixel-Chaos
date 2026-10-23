import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {TYPES} from '../dist/catalog.js';
import {ABILITIES,castPose} from '../dist/abilities.js';
import {AbilityFX} from '../dist/ability-fx.js';
import {Battle} from '../dist/sim.js';
import {ProjectileRenderer} from '../dist/crowd.js';
function finiteScene(scene){scene.updateMatrixWorld(true);scene.traverse(o=>{for(const n of o.matrixWorld.elements)assert.ok(Number.isFinite(n),o.type);if(o.geometry)for(const a of Object.values(o.geometry.attributes))for(const n of a.array)assert.ok(Number.isFinite(n));if(o.material?.opacity!==undefined)assert.ok(Number.isFinite(o.material.opacity));});}
test('all twenty characters have distinct staged recipes and finite articulated poses',()=>{
 assert.deepEqual(Object.keys(ABILITIES).sort(),Object.keys(TYPES).sort());assert.equal(new Set(Object.values(ABILITIES).map(a=>a.visual)).size,20);
 for(const type of Object.keys(TYPES))for(const phase of ['charge','release'])for(const progress of [0,.2,.5,.9,1]){const pose=castPose(type,phase,progress);assert.ok(Object.values(pose).flat().every(Number.isFinite));}
});
test('every normal and GOD ability creates valid geometry through its complete lifetime',()=>{
 for(const type of Object.keys(TYPES))for(const god of [false,true]){
  const scene=new T.Scene(),fx=new AbilityFX(scene);fx.high=true;const battle=new Battle([{type,god,team:'blue',x:-2,z:0},{type:'saitama',team:'red',x:2,z:0}]),[unit,target]=battle.units;unit.angle=Math.PI/2;
  fx.charge({unit,target,duration:ABILITIES[type].charge});fx.update(.12);finiteScene(scene);
  fx.release({unit,target,radius:unit.mods.radius,ability:TYPES[type].ability});fx.impact({source:unit,style:type,x:target.x,z:target.z,power:unit.mods.blast,special:true});
  for(let i=0;i<10;i++){fx.update(.15);finiteScene(scene);}fx.update(3);assert.equal(fx.effects.length,0);assert.equal(scene.children.length,0);fx.clear();
 }
});
test('windup emits before release and does not apply special damage early',()=>{
 const events=[],battle=new Battle([{type:'gojo',team:'blue',x:-2,z:0},{type:'saitama',team:'red',x:2,z:0}],e=>events.push(e),()=>.5),[u,v]=battle.units;u.cool=v.cool=u.special=v.special=Infinity;v.stun=100;
 battle.beginCast(u,v);assert.equal(events[0].type,'charge');assert.equal(v.hp,v.maxHp);
 for(let i=0;i<20;i++)battle.step(1/60);assert.ok(u.casting);assert.equal(v.hp,v.maxHp);
 for(let i=0;i<45;i++)battle.step(1/60);assert.equal(u.casting,null);assert.ok(events.some(e=>e.type==='special'));assert.ok(v.hp<v.maxHp);
});
test('stun and death cancel charged attacks',()=>{
 for(const death of [false,true]){const events=[],b=new Battle([{type:'goku',team:'blue',x:-2,z:0},{type:'saitama',team:'red',x:2,z:0}],e=>events.push(e)),[u,v]=b.units;b.beginCast(u,v);if(death)b.damage(u,1e6,v);else u.stun=1;b.step(1/60);assert.equal(u.casting,null);assert.ok(events.some(e=>e.type==='cancel'));assert.equal(b.projectiles.length,0);}
});
test('decorative effect budget never changes simulation or GOD projectile count',()=>{
 const b=new Battle([{type:'ironman',god:true,team:'blue',x:-2,z:0},{type:'saitama',team:'red',x:2,z:0}]),[u,v]=b.units;b.cast(u,v,b.units);assert.equal(b.projectiles.length,600);
 const fx=new AbilityFX(new T.Scene());for(let i=0;i<200;i++)fx.impact({source:u,style:u.type,x:v.x,z:v.z,power:1,special:true});assert.ok(fx.effects.length<=26);assert.equal(b.projectiles.length,600);fx.clear();
});
test('projectile renderer retains every core and trail and renders actual missile instances',()=>{
 const scene=new T.Scene(),r=new ProjectileRenderer(scene),shots=Array.from({length:600},(_,i)=>({style:'ironman',special:true,x:i%10,z:i%9,vx:4,vz:6,age:.2,delay:0,color:0x8feaff,id:i}));r.sync(shots);assert.equal(r.points.geometry.drawRange.count,600);assert.equal(r.trails.geometry.drawRange.count,600*10);assert.equal(r.missiles.count,600);finiteScene(scene);
 const expanded=r.material.fragmentShader.replace(/#include <([\w_]+)>/g,(_,chunk)=>{assert.ok(T.ShaderChunk[chunk],chunk);return T.ShaderChunk[chunk];});assert.ok(!expanded.includes('#include'));r.sync([]);assert.equal(r.missiles.count,0);assert.equal(r.points.geometry.drawRange.count,0);
});
