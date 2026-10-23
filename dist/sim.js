import {TYPES,modifiers} from './catalog.js?v=0.4';
import {WORLD} from './world.js?v=0.4';
import {ABILITIES} from './abilities.js?v=0.4';
export {TYPES} from './catalog.js?v=0.4';
export const CHALLENGES=[{name:'Primeiro confronto',budget:850,enemies:[['naruto',3,0],['luffy',5,2]]},{name:'Rajadas cruzadas',budget:1200,enemies:[['goku',5,-3],['goku',5,3],['naruto',2,0]]},{name:'Maré de clones',budget:1500,enemies:[['naruto',3,-4],['naruto',3,0],['naruto',3,4],['naruto',6,-2],['naruto',6,2]]},{name:'Linha de frente',budget:1900,enemies:[['luffy',2,-3],['luffy',2,0],['luffy',2,3],['goku',6,-2],['goku',6,2]]},{name:'Caos total',budget:2400,enemies:[['goku',5,-4],['goku',5,4],['luffy',2,-2],['luffy',2,2],['naruto',5,0],['naruto',7,-2],['naruto',7,2]]}];
// Spatial buckets replace the all-pairs separation and per-frame target scans.
class SpatialGrid {
 constructor(units,size=4){this.size=size;this.cells=new Map();this.teams={blue:0,red:0};for(const u of units){this.teams[u.team]++;const key=this.key(Math.floor(u.x/size),Math.floor(u.z/size));if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(u);}}
 key(x,z){return `${x},${z}`;}
 nearby(x,z,r){const result=[],s=this.size;for(let a=Math.floor((x-r)/s);a<=Math.floor((x+r)/s);a++)for(let b=Math.floor((z-r)/s);b<=Math.floor((z+r)/s);b++){const bucket=this.cells.get(this.key(a,b));if(bucket)result.push(...bucket);}return result;}
 nearest(u){if(!this.teams[u.team==='blue'?'red':'blue'])return null;let target=null,best=Infinity;const s=this.size,cx=Math.floor(u.x/s),cz=Math.floor(u.z/s),max=Math.ceil(Math.max(WORLD.width,WORLD.depth)/s)+1;
  for(let r=0;r<=max;r++){for(let x=cx-r;x<=cx+r;x++)for(let z=cz-r;z<=cz+r;z++){if(r&&x!==cx-r&&x!==cx+r&&z!==cz-r&&z!==cz+r)continue;const cell=this.cells.get(this.key(x,z));if(!cell)continue;for(const v of cell){if(v.team===u.team||v.hp<=0)continue;const d=(v.x-u.x)**2+(v.z-u.z)**2;if(d<best){best=d;target=v;}}}if(target&&r*s>Math.sqrt(best))break;}
  return target;
 }
}
export class Battle {
 constructor(formation,onEvent=()=>{},random=Math.random){
  this.onEvent=onEvent;this.time=0;this.finished=false;this.winner=null;this.projectiles=[];this.projectileId=0;
  this.units=formation.map((f,i)=>({...f,god:f.god===true,mods:modifiers(f.type,f.god===true),id:i,hp:TYPES[f.type].hp,maxHp:TYPES[f.type].hp,cool:random()*.5,special:2+random()*3,retarget:0,targetId:null,hit:0,attack:0,dead:0,vx:0,vz:0,stun:0,slow:0,guard:0,moving:false,casting:null,releaseTime:0,lift:0}));
 }
 damage(u,n,source,impulse=1.8){
  if(u.hp<=0)return;
  u.hp=Math.max(0,u.hp-n*(u.guard>0?.45:1)/u.mods.defense);u.hit=.2;
  this.push(u,source,impulse);
  if(!u.hp){if(u.casting){u.casting=null;this.onEvent({type:'cancel',unit:u});}if(this.grid)this.grid.teams[u.team]--;this.onEvent({type:'death',unit:u,source});}
 }
 push(u,source,impulse){const dx=u.x-source.x,dz=u.z-source.z,len=Math.hypot(dx,dz)||1,k=impulse*source.mods.knockback;u.vx+=dx/len*k;u.vz+=dz/len*k;}
 blast(source,x,z,r,damage,fn=()=>{}){
  const radius=r*source.mods.radius,power=damage*source.mods.blast;
  const candidates=this.grid?this.grid.nearby(x,z,radius):this.units;
  for(const v of candidates)if(v.team!==source.team&&v.hp>0&&Math.hypot(v.x-x,v.z-z)<=radius){this.damage(v,power,source);fn(v);}
 }
 shoot(u,target,damage,count=1,options={}){
  const n=count*u.mods.projectiles;
  const nearby=(this.grid?this.grid.nearby(target.x,target.z,8):this.units).filter(v=>v.team!==u.team&&v.hp>0&&Math.hypot(v.x-target.x,v.z-target.z)<8);
  const targets=nearby.length?nearby:[target];
  for(let i=0;i<n;i++){
   const victim=targets[i%targets.length],spread=n>1?((i%13)-6)*.055:0,angle=Math.atan2(victim.x-u.x,victim.z-u.z)+spread;
   this.projectiles.push({id:this.projectileId++,source:u,targetId:victim.id,x:u.x,z:u.z,vx:Math.sin(angle)*22,vz:Math.cos(angle)*22,damage,color:TYPES[u.type].color,style:u.type,age:0,special:options.special===true,life:5,delay:n>1?i/n*.65:0,...options});
  }
  this.onEvent({type:'volley',unit:u,count:n});
 }
 beginCast(u,target){const profile=ABILITIES[u.type];u.casting={remaining:profile.charge,duration:profile.charge,targetId:target.id};u.moving=false;this.onEvent({type:'charge',unit:u,target,duration:profile.charge,ability:TYPES[u.type].ability});}
 cast(u,target,live){
  const profile=ABILITIES[u.type];u.angle=Math.atan2(target.x-u.x,target.z-u.z);u.releaseTime=profile.release;u.releaseDuration=profile.release;
  if(['rasengan','chidori'].includes(TYPES[u.type].ability)){const old={x:u.x,z:u.z},dx=target.x-u.x,dz=target.z-u.z,d=Math.hypot(dx,dz)||1,step=Math.max(0,Math.min(d-1.3,7));u.x+=dx/d*step;u.z+=dz/d*step;this.onEvent({type:'dash',unit:u,from:old,to:{x:u.x,z:u.z}});}

  const def=TYPES[u.type],kind=def.ability;
  const area=(x,z,r,damage,fn)=>this.blast(u,x,z,r,damage,fn);
  const duration=n=>n*u.mods.control;
  if(def.role==='ranged'){
   const count=kind==='missiles'?6:kind==='volley'?3:1;
   this.shoot(u,target,kind==='beam'?125:kind==='web'?65:kind==='spell'?85:95,count,{special:true,stun:kind==='web'?1.35:kind==='spell'?1:0,slow:kind==='web'?3:0});
  }else switch(kind){
   case 'slash':for(const v of live){if(v.team===u.team||v.hp<=0)continue;const dx=v.x-u.x,dz=v.z-u.z,along=dx*Math.sin(u.angle)+dz*Math.cos(u.angle),across=Math.abs(dx*Math.cos(u.angle)-dz*Math.sin(u.angle));if(along>=0&&along<14&&across<2.2)this.damage(v,115,u);}break;
   case 'rasengan':area(target.x,target.z,2.5,130);break;
   case 'stretch':area(u.x,u.z,5,85,v=>this.push(v,u,6));break;
   case 'void':area(target.x,target.z,3.4,105,v=>{v.slow=2.4;});u.guard=1.8;break;
   case 'water':area(u.x,u.z,4.2,95);u.guard=1.2;break;
   case 'force':this.damage(target,120,u);target.stun=duration(1.6);target.lift=1.6;area(target.x,target.z,2.5,25);break;
   case 'heal':for(const ally of live)if(ally.team===u.team&&ally.hp>0&&Math.hypot(ally.x-u.x,ally.z-u.z)<5*u.mods.radius)ally.hp=Math.min(ally.maxHp,ally.hp+80*u.mods.healing);area(u.x,u.z,4,50,v=>this.push(v,u,4));break;
   case 'ice':area(target.x,target.z,3.6,90,v=>{v.slow=4;});break;
   case 'psychic':area(target.x,target.z,3.2,100,v=>{this.push(v,u,9);v.stun=.55;});break;
   case 'shadow':area(target.x,target.z,2,95,v=>{v.slow=duration(2);});u.guard=2;break;
   case 'chidori':this.damage(target,140,u);target.stun=.7;break;
   case 'punch':area(target.x,target.z,3.2,250,v=>this.push(v,u,12));break;
   case 'explosion':area(target.x,target.z,4,120,v=>this.push(v,u,8));break;
   case 'lightning':area(target.x,target.z,4.3,125,v=>{v.stun=.6;});break;
   case 'aard':area(u.x,u.z,4,85,v=>{this.push(v,u,14);v.stun=.6;});break;
  }
  this.onEvent({type:'special',unit:u,target,angle:u.angle,ability:kind,power:u.mods.blast,radius:u.mods.radius});
 }
 updateProjectiles(dt){
  let write=0;const enemies={blue:this.units.filter(u=>u.team==='red'&&u.hp>0),red:this.units.filter(u=>u.team==='blue'&&u.hp>0)},heads={blue:0,red:0};
  for(const p of this.projectiles){
   p.delay-=dt;if(p.delay>0){this.projectiles[write++]=p;continue;}p.life-=dt;p.age+=dt;
   let target=this.units[p.targetId];
   if(!target||target.hp<=0){const list=enemies[p.source.team];while(heads[p.source.team]<list.length&&list[heads[p.source.team]].hp<=0)heads[p.source.team]++;target=list[heads[p.source.team]];if(target)p.targetId=target.id;else continue;}
   if(target){
    const dx=target.x-p.x,dz=target.z-p.z,dist=Math.hypot(dx,dz);
    if(dist<=22*dt+.4){
     if(p.explode)this.blast(p.source,target.x,target.z,1.5,p.damage);
     else this.damage(target,p.damage,p.source,.7);
     if(p.stun)target.stun=Math.max(target.stun,p.stun*p.source.mods.control);
     if(p.slow)target.slow=Math.max(target.slow,p.slow*p.source.mods.control);
     this.onEvent({type:'impact',x:target.x,z:target.z,color:p.color,power:p.explode?p.source.mods.blast:1,style:p.style,source:p.source,target,special:p.special,stun:p.stun});continue;
    }
    const steer=Math.min(1,dt*9);p.vx+=(dx/(dist||1)*22-p.vx)*steer;p.vz+=(dz/(dist||1)*22-p.vz)*steer;
   }
   p.x+=p.vx*dt;p.z+=p.vz*dt;
   if(p.life>0&&Math.abs(p.x)<WORLD.width&&Math.abs(p.z)<WORLD.depth)this.projectiles[write++]=p;
  }
  this.projectiles.length=write;
 }
 step(dt){
  if(this.finished)return;this.time+=dt;
  const live=this.units.filter(u=>u.hp>0);this.grid=new SpatialGrid(live);
  for(const u of this.units){
   for(const key of ['hit','attack','stun','slow','guard','releaseTime','lift'])u[key]=Math.max(0,u[key]-dt);u.moving=false;
   if(!u.hp){u.dead+=dt;continue;}
   u.x+=u.vx*dt;u.z+=u.vz*dt;u.vx*=Math.exp(-8*dt);u.vz*=Math.exp(-8*dt);u.cool-=dt;u.special-=dt;u.retarget-=dt;
   if(u.stun>0){if(u.casting){u.casting=null;u.special=Math.max(1,u.special);this.onEvent({type:'cancel',unit:u});}continue;}
   if(u.casting){u.casting.remaining-=dt;if(u.casting.remaining<=0){const target=this.units[u.casting.targetId]?.hp>0?this.units[u.casting.targetId]:this.grid.nearest(u);u.casting=null;if(target)this.cast(u,target,live);}continue;}
   let target=this.units[u.targetId];
   if(u.retarget<=0||!target||target.hp<=0){target=this.grid.nearest(u);u.targetId=target?.id;u.retarget=.3+(u.id%7)*.015;}
   if(!target)continue;
   const def=TYPES[u.type],dist=Math.hypot(target.x-u.x,target.z-u.z);u.angle=Math.atan2(target.x-u.x,target.z-u.z);
   if(dist>def.range){const movement=def.speed*(u.slow>0?.45:1)*dt;u.x+=Math.sin(u.angle)*movement;u.z+=Math.cos(u.angle)*movement;u.moving=true;}
   else if(u.cool<=0){u.cool=def.cooldown;u.attack=.32;
    if(def.range>3){this.shoot(u,target,def.damage,1,{explode:def.role==='explosive'});}else{this.damage(target,def.damage,u);this.onEvent({type:'hit',unit:u,target});}
   }
   const reach=['stretch','water','heal','punch','aard','chidori'].includes(def.ability)?4.8:12;
   if(u.special<=0&&dist<reach&&target.hp>0){u.special=def.special;u.attack=.7;this.beginCast(u,target);}
  }
  this.updateProjectiles(dt);
  for(const a of live){if(a.hp<=0)continue;for(const b of this.grid.nearby(a.x,a.z,.9)){
   if(b.id<=a.id||b.hp<=0)continue;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
   if(d<.78){const nx=d>0?dx/d:1,nz=d>0?dz/d:0,s=(.78-d)*.5;a.x-=nx*s;a.z-=nz*s;b.x+=nx*s;b.z+=nz*s;}
  }}
  for(const u of this.units){const x=Math.max(-WORLD.halfX,Math.min(WORLD.halfX,u.x)),z=Math.max(-WORLD.halfZ,Math.min(WORLD.halfZ,u.z));if(x!==u.x)u.vx=0;if(z!==u.z)u.vz=0;u.x=x;u.z=z;}
  const teams=new Set(this.units.filter(u=>u.hp>0).map(u=>u.team));
  if(teams.size<2||this.time>=WORLD.battleSeconds){this.finished=true;this.winner=teams.size===1?[...teams][0]:null;this.onEvent({type:'finish',winner:this.winner});}
 }
}
