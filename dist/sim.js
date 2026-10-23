import {TYPES} from './catalog.js?v=0.2';
export {TYPES} from './catalog.js?v=0.2';
export const CHALLENGES=[{name:'Primeiro confronto',budget:850,enemies:[['naruto',3,0],['luffy',5,2]]},{name:'Rajadas cruzadas',budget:1200,enemies:[['goku',5,-3],['goku',5,3],['naruto',2,0]]},{name:'Maré de clones',budget:1500,enemies:[['naruto',3,-4],['naruto',3,0],['naruto',3,4],['naruto',6,-2],['naruto',6,2]]},{name:'Linha de frente',budget:1900,enemies:[['luffy',2,-3],['luffy',2,0],['luffy',2,3],['goku',6,-2],['goku',6,2]]},{name:'Caos total',budget:2400,enemies:[['goku',5,-4],['goku',5,4],['luffy',2,-2],['luffy',2,2],['naruto',5,0],['naruto',7,-2],['naruto',7,2]]}];
export class Battle {
 constructor(formation,onEvent=()=>{},random=Math.random){
  this.onEvent=onEvent;this.time=0;this.finished=false;this.winner=null;
  this.units=formation.map((f,i)=>({...f,id:i,hp:TYPES[f.type].hp,maxHp:TYPES[f.type].hp,cool:random()*.5,special:2+random()*3,hit:0,attack:0,dead:0,vx:0,vz:0,stun:0,slow:0,guard:0,moving:false}));
 }
 damage(u,n,source){
  if(u.hp<=0)return;
  u.hp=Math.max(0,u.hp-n*(u.guard>0?.45:1));u.hit=.2;
  const dx=u.x-source.x,dz=u.z-source.z,len=Math.hypot(dx,dz)||1;
  u.vx+=dx/len*1.8;u.vz+=dz/len*1.8;
  if(!u.hp)this.onEvent({type:'death',unit:u,source});
 }
 cast(u,target,live){
  const def=TYPES[u.type],kind=def.ability;
  const victims=live.filter(v=>v.team!==u.team&&v.hp>0);
  const near=(v,x,z,r)=>Math.hypot(v.x-x,v.z-z)<r;
  const area=(x,z,r,damage,fn=()=>{})=>{for(const v of victims)if(near(v,x,z,r)){this.damage(v,damage,u);fn(v);}};
  switch(kind){
   case 'beam': case 'slash':
    for(const v of victims){const dx=v.x-u.x,dz=v.z-u.z,along=dx*Math.sin(u.angle)+dz*Math.cos(u.angle),across=Math.abs(dx*Math.cos(u.angle)-dz*Math.sin(u.angle));if(along>=0&&along<14&&across<(kind==='beam'?1.6:2.2))this.damage(v,kind==='beam'?125:115,u);}break;
   case 'rasengan': this.damage(target,95,u);area(target.x,target.z,2.5,35);break;
   case 'stretch':area(u.x,u.z,5,85,v=>{v.vx+=Math.sin(u.angle)*6;v.vz+=Math.cos(u.angle)*6;});break;
   case 'void':area(target.x,target.z,3.4,105,v=>{v.slow=2.4;});u.guard=1.8;break;
   case 'water':area(u.x,u.z,4.2,95);u.guard=1.2;break;
   case 'force':this.damage(target,120,u);target.stun=1.6;area(target.x,target.z,2.5,25);break;
   case 'heal':for(const ally of live)if(ally.team===u.team&&ally.hp>0&&near(ally,u.x,u.z,5))ally.hp=Math.min(ally.maxHp,ally.hp+80);area(u.x,u.z,4,50,v=>{v.vx+=Math.sin(u.angle)*4;v.vz+=Math.cos(u.angle)*4;});break;
   case 'web':area(target.x,target.z,2.8,65,v=>{v.stun=1.35;v.slow=3;});break;
   case 'ice':area(target.x,target.z,3.6,90,v=>{v.slow=4;});break;
   case 'psychic':area(target.x,target.z,3.2,100,v=>{v.vx+=Math.sin(u.angle)*9;v.vz+=Math.cos(u.angle)*9;v.stun=.55;});break;
   case 'shadow':this.damage(target,95,u);target.slow=2;u.guard=2;break;
  }
  this.onEvent({type:'special',unit:u,target,angle:u.angle,ability:kind});
 }
 step(dt){
  if(this.finished)return;this.time+=dt;
  const live=this.units.filter(u=>u.hp>0);
  for(const u of this.units){
   for(const key of ['hit','attack','stun','slow','guard'])u[key]=Math.max(0,u[key]-dt);
   u.moving=false;
   if(!u.hp){u.dead+=dt;continue;}
   u.x+=u.vx*dt;u.z+=u.vz*dt;u.vx*=Math.exp(-8*dt);u.vz*=Math.exp(-8*dt);
   u.cool-=dt;u.special-=dt;
   if(u.stun>0)continue;
   const def=TYPES[u.type];let target,dist=Infinity;
   for(const v of live){if(v.team===u.team||v.hp<=0)continue;const d=Math.hypot(v.x-u.x,v.z-u.z);if(d<dist){dist=d;target=v;}}
   if(!target)continue;
   u.angle=Math.atan2(target.x-u.x,target.z-u.z);
   if(dist>def.range){const movement=def.speed*(u.slow>0?.45:1)*dt;u.x+=Math.sin(u.angle)*movement;u.z+=Math.cos(u.angle)*movement;u.moving=true;}
   else if(u.cool<=0){u.cool=def.cooldown;u.attack=.32;this.damage(target,def.damage,u);this.onEvent({type:'hit',unit:u,target});}
   const reach=['stretch','water','heal'].includes(def.ability)?4.8:10;
   if(u.special<=0&&dist<reach){u.special=def.special;u.attack=.7;this.cast(u,target,live);}
  }
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
   const a=live[i],b=live[j];if(a.hp<=0||b.hp<=0)continue;
   const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
   if(d<.78){const nx=d>0?dx/d:1,nz=d>0?dz/d:0,s=(.78-d)*.5;a.x-=nx*s;a.z-=nz*s;b.x+=nx*s;b.z+=nz*s;}
  }
  for(const u of this.units){u.x=Math.max(-11,Math.min(11,u.x));u.z=Math.max(-7,Math.min(7,u.z));}
  const teams=new Set(this.units.filter(u=>u.hp>0).map(u=>u.team));
  if(teams.size<2||this.time>=120){this.finished=true;this.winner=teams.size===1?[...teams][0]:null;this.onEvent({type:'finish',winner:this.winner});}
 }
}
