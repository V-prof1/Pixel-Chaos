import * as T from './vendor/three.module.min.js';
import {ABILITIES} from './abilities.js?v=0.4';
const geo={orb:new T.SphereGeometry(1,16,10),ring:new T.TorusGeometry(1,.035,5,48),tube:new T.CylinderGeometry(1,1,1,12),cone:new T.ConeGeometry(1,1,12),crystal:new T.ConeGeometry(1,1,5),arc:new T.TorusGeometry(1,.09,6,36,Math.PI*1.45),hand:new T.CapsuleGeometry(.12,.2,3,8)};
const Y=new T.Vector3(0,1,0);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>1-(1-clamp(x))**3;
function softTexture(){const data=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const d=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5),i=(y*32+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(Math.max(0,1-d)**2*255);}const t=new T.DataTexture(data,32,32);t.needsUpdate=true;return t;}
const glowTexture=softTexture();
class Effect{
 constructor(scene,kind,unit,target,duration,scale=1){this.scene=scene;this.kind=kind;this.unit=unit;this.target=target;this.duration=duration;this.age=0;this.scale=scale;this.group=new T.Group();this.group.position.set(unit.x,0,unit.z);this.angle=Math.atan2(target.x-unit.x,target.z-unit.z);this.distance=Math.hypot(target.x-unit.x,target.z-unit.z);this.group.rotation.y=this.angle;this.materials=[];this.ownGeo=[];this.ticks=[];scene.add(this.group);}
 material(color,opacity=1,add=true){const m=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,blending:add?T.AdditiveBlending:T.NormalBlending});this.materials.push({material:m,opacity});return m;}
 part(shape,color,x,y,z,sx=1,sy=sx,sz=sx,opacity=1,add=true){const mesh=new T.Mesh(geo[shape],this.material(color,opacity,add));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);this.group.add(mesh);return mesh;}
 ring(color,x,y,z,r,opacity=.7,flat=false){const m=this.part('ring',color,x,y,z,r,r,r,opacity);if(flat)m.rotation.x=Math.PI/2;return m;}
 line(points,color,opacity=1){const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));this.ownGeo.push(g);const material=new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending});this.materials.push({material,opacity});const line=new T.Line(g,material);this.group.add(line);return line;}
 beam(a,b,color,width=.1,opacity=.7){const v1=new T.Vector3(...a),v2=new T.Vector3(...b),d=v2.clone().sub(v1);const m=this.part('tube',color,...v1.clone().add(v2).multiplyScalar(.5).toArray(),width,d.length(),width,opacity);m.quaternion.setFromUnitVectors(Y,d.normalize());return m;}
 particles(color,center,count=22,radius=2,lift=2,size=.17,smoke=false){
  const positions=new Float32Array(count*3),vel=[];
  for(let i=0;i<count;i++){const a=i*2.39996;vel.push([Math.cos(a)*radius*(.4+(i%5)/7),lift*(.4+(i%7)/8),Math.sin(a)*radius*(.4+(i%5)/7)]);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));this.ownGeo.push(g);
  const m=new T.PointsMaterial({color,size,map:glowTexture,transparent:true,opacity:smoke?.28:.9,blending:smoke?T.NormalBlending:T.AdditiveBlending,depthWrite:false});this.materials.push({material:m,opacity:smoke?.28:.9});const cloud=new T.Points(g,m);cloud.frustumCulled=false;this.group.add(cloud);
  this.ticks.push((p,t)=>{for(let i=0;i<count;i++){positions[i*3]=center[0]+vel[i][0]*t;positions[i*3+1]=center[1]+vel[i][1]*t-(smoke?0:2*t*t);positions[i*3+2]=center[2]+vel[i][2]*t;}g.attributes.position.needsUpdate=true;});return cloud;
 }
 swirl(color,center,radius=1,height=.3,turns=2,opacity=.8){const points=[];for(let i=0;i<=64;i++){const t=i/64,a=t*Math.PI*2*turns;points.push([Math.cos(a)*radius,Math.sin(a)*radius*.35+(t-.5)*height,(t-.5)*radius*.9]);}const m=this.line(points,color,opacity);m.position.set(...center);this.ticks.push((p,t)=>{m.rotation.z=t*9;m.rotation.y=t*3;});return m;}
 bolt(start,end,color,seed=0,width=.025){const points=[],a=new T.Vector3(...start),b=new T.Vector3(...end);for(let i=0;i<=14;i++){const t=i/14,j=Math.sin(t*Math.PI),k=Math.sin(i*17.1+seed)*.32*j;points.push([a.x+(b.x-a.x)*t+k,a.y+(b.y-a.y)*t+Math.cos(i*9.3+seed)*.18*j,a.z+(b.z-a.z)*t]);}const line=this.line(points,color,.9);this.ticks.push((p,t)=>{line.visible=Math.sin(t*49+seed)>-.5;});return points;}
 wave(color,center,maxRadius,delay=0,opacity=.7){const ring=this.ring(color,...center,.1,opacity,true);this.ticks.push((p,t)=>{const q=clamp((t-delay)/Math.max(.1,this.duration-delay));ring.visible=t>=delay;ring.scale.setScalar(.15+ease(q)*maxRadius);});return ring;}
 runes(color,center,radius=1){const g=new T.Group();this.group.add(g);const ring=this.ring(color,...center,radius,.45,true);for(let i=0;i<12;i++){const a=i*Math.PI/6,x=center[0]+Math.cos(a)*radius,z=center[2]+Math.sin(a)*radius;this.line([[x-.08,.05,z-.07],[x,.05,z+.12],[x+.08,.05,z-.07]],color,.4);}this.ticks.push((p,t)=>ring.rotation.z=t*.5);return g;}
 update(dt){this.age+=dt;const p=clamp(this.age/this.duration);if(this.kind==='charge'){this.group.position.set(this.unit.x,0,this.unit.z);this.group.rotation.y=this.unit.angle??this.angle;}
  const envelope=this.kind==='charge'?.25+.7*p:Math.min(1,this.age/.07)*(1-p)**.65;for(const {material,opacity}of this.materials)material.opacity=opacity*envelope;for(const tick of this.ticks)tick(p,this.age);return this.age<this.duration;
 }
 dispose(){this.scene.remove(this.group);for(const m of this.materials)m.material.dispose();for(const g of this.ownGeo)g.dispose();}
}
export class AbilityFX{
 constructor(scene){this.scene=scene;this.effects=[];this.high=false;this.lastShake=0;}
 clear(){for(const f of this.effects)f.dispose();this.effects.length=0;}
 make(kind,u,target,duration=1.05){const limit=this.high?48:26;if(kind==='impact'&&this.effects.filter(f=>f.kind==='impact').length>=(this.high?14:8))return null;if(this.effects.length>=limit){const index=this.effects.findIndex(f=>f.kind==='impact');if(kind!=='impact'&&index>=0){this.effects[index].dispose();this.effects.splice(index,1);}else return null;}const f=new Effect(this.scene,kind,u,target,duration,u.god?1.35:1);this.effects.push(f);return f;}
 charge(e){const f=this.make('charge',e.unit,e.target,e.duration);if(!f)return;const profile=ABILITIES[e.unit.type],[a,b,c]=profile.palette;
  const center=profile.pose==='beam'?[0,1.35,.5]:[.38,1.3,.4];
  const core=f.part('orb',c,...center,.04,.04,.04,.45);const halo=f.part('orb',a,...center,.24,.24,.24,.11);
  f.ticks.push(p=>{core.scale.setScalar(.05+p*.12);halo.scale.setScalar(.12+p*.30);});
  for(let i=0;i<2;i++){const ring=f.ring(i?a:b,...center,.25+i*.08,.65);ring.rotation.x=i?1.1:.3;f.ticks.push((p,t)=>{ring.rotation.y=t*(i?7:-6);ring.scale.setScalar(.12+p*(.25+i*.1));});}
  if(profile.visual==='purple')for(const side of [-1,1]){const orb=f.part('orb',side<0?b:c,side*.7,1.45,.45,.17,.17,.17,.5);f.ticks.push(p=>orb.position.x=side*.7*(1-p));}
  if(['chidori','thunder','finalflash'].includes(profile.visual))for(let i=0;i<5;i++)f.bolt([.3,1.3,.4],[Math.cos(i)*.7,1.7+Math.sin(i)*.3,.6],b,i);
  f.wave(a,[0,.04,0],1.1,0,.22);
 }
 cancel(unit){for(let i=this.effects.length-1;i>=0;i--)if(this.effects[i].kind==='charge'&&this.effects[i].unit.id===unit.id){this.effects[i].dispose();this.effects.splice(i,1);}}
 dash(e){const f=this.make('dash',{...e.unit,...e.from},e.to,.45);if(!f)return;const color=ABILITIES[e.unit.type].palette[0];f.beam([0,.7,0],[0,.7,f.distance],color,.12,.35);for(let i=0;i<5;i++)f.ring(color,0,.8,f.distance*i/5,.35,.35);}
 release(e){this.cancel(e.unit);const f=this.make('release',e.unit,e.target,['forcechoke','frost','thing'].includes(ABILITIES[e.unit.type].visual)?1.65:1.15);if(!f)return;
  const profile=ABILITIES[e.unit.type],v=profile.visual,[a,b,c]=profile.palette,d=f.distance,s=f.scale,blast=Math.min(4,Math.sqrt(e.radius||1));this.lastShake=Math.min(.13,.035*s);f.wave(a,[0,.04,0],1.2*s,0,.18);
  if(v==='kamehameha'||v==='finalflash'){
   const length=Math.min(20,Math.max(5,d));const core=f.beam([0,1.35,.5],[0,1.35,length],c,.11*s,.85),halo=f.beam([0,1.35,.5],[0,1.35,length],a,.28*s,.18);
   for(let i=0;i<4;i++){const ring=f.ring(i%2?a:b,0,1.35,1+i*2,.28*s,.6);f.ticks.push((p,t)=>{ring.position.z=1+(t*18+i*2)%length;ring.scale.setScalar((.20+Math.sin(t*10+i)*.03)*s);});}
   f.swirl(a,[0,1.35,1.1],.6*s,.4,2,.6);f.particles(b,[0,1.35,.6],20,2,2,.18);
   f.ticks.push((p,t)=>{core.scale.x=core.scale.z=(.08+Math.sin(t*40)*.02)*s;halo.scale.x=halo.scale.z=(.22+Math.sin(t*25)*.04)*s;});
  }else if(v==='rasengan'){
   const orb=f.part('orb',b,0,1.15,d,.35*s,.35*s,.35*s,.24);f.swirl(c,[0,1.15,d],.55*s,.2,3);f.swirl(a,[0,1.15,d],.7*s,.5,3,.7);f.wave(a,[0,.06,d],2.5*blast,0,.6);f.particles(b,[0,1,d],32,3,3);
  }else if(v==='purple'){
   const orb=f.part('orb',a,0,1.35,d,.6*s,.6*s,.6*s,.20);f.swirl(c,[0,1.35,d],1.15*s,.5,2,.8);f.swirl(b,[0,1.35,d],.85*s,.3,3,.7);f.wave(a,[0,.06,d],3.4*blast,0,.55);f.particles(a,[0,1.35,d],38,4,3,.2);
   for(let i=0;i<6;i++)f.bolt([0,1.35,d],[Math.cos(i)*2,1+Math.sin(i),d+Math.sin(i)*2],a,i);
  }else if(v==='elastic'||v==='seriouspunch'){
   const reach=v==='elastic'?Math.max(4,d):Math.max(2,d);const arm=f.beam([.4,1.35,.25],[.4,1.35,reach],v==='elastic'?a:0xffffff,v==='elastic'?.12:.07,.85);const fist=f.part('orb',v==='elastic'?0x332c30:b,.4,1.35,reach,.4*s,.34*s,.42*s,.95,false);
   for(let i=0;i<3;i++){const ring=f.ring(c,.4,1.35,reach,.3,.8);f.ticks.push((p,t)=>{ring.scale.setScalar((.4+ease(p)*(2.6+i*.8))*s);ring.position.z=reach+ease(p)*i*.5;});}
   f.wave(b,[0,.05,d],(v==='seriouspunch'?4:2.8)*s,.03,.65);f.particles(b,[0,1,d],24,5,3,.2);
   f.ticks.push(p=>{const recoil=1-Math.max(0,(p-.45)/.55);arm.scale.x=arm.scale.z=.12*recoil;});
  }else if(v==='getsuga'||v==='waterdragon'){
   for(let i=0;i<(v==='getsuga'?2:4);i++){
    const arc=f.part('arc',i%2?b:a,0,1,d*.45,1.25+i*.08,1.25+i*.08,.8,i?.35:.8);arc.rotation.set(v==='waterdragon'?Math.PI/2:.2,.2,i*.42);
    f.ticks.push((p,t)=>{arc.position.z=v==='getsuga'?ease(p)*Math.max(8,d):Math.sin(t*8+i)*1.2;arc.rotation.z=(v==='waterdragon'?t*7:0)+i*.4;});
   }
   if(v==='waterdragon'){for(let j=0;j<3;j++){const line=[];for(let i=0;i<55;i++){const q=i/54,ang=q*Math.PI*3;line.push([Math.cos(ang)*(1+q),.25+q*1.4,Math.sin(ang)*(1+q)]);}const ribbon=f.line(line,j===0?c:j===1?b:a,.7);ribbon.rotation.y=j*.1;f.ticks.push((p,t)=>ribbon.rotation.y=t*5+j*.1);}f.wave(a,[0,.05,0],4.2,0,.55);}
   f.particles(c,[0,.8,d*.5],25,3,2,.13);
  }else if(v==='forcechoke'){
   for(let i=0;i<5;i++){const ring=f.ring(i%2?a:b,0,.3+i*.38,d,.6,.6,true);f.ticks.push((p,t)=>{ring.position.y=.3+i*.32+Math.sin(t*5)*.35;ring.rotation.z=t*(i%2?2:-2);});}f.line([[.4,1.4,.5],[.2,1.7,d*.6],[0,1.8,d]],b,.22);f.particles(a,[0,1,d],16,.6,1.8,.1);
  }else if(v==='forcewave'||v==='telekinesis'||v==='aard'){
   const z=v==='telekinesis'?d:0,r=(v==='forcewave'?5:v==='aard'?4:3.2)*blast;
   for(let i=0;i<3;i++)f.wave(i%2?b:a,[0,.07+i*.035,z],r*(1-i*.15),i*.1,.65);
   f.particles(b,[0,.5,z],28,5,2,.15);
   if(v==='forcewave')f.runes(a,[0,.055,0],3*blast);
   if(v==='aard')for(let i=0;i<4;i++){const ring=f.ring(b,0,1,1+i*.7,.3,.5);f.ticks.push(p=>{ring.position.z=1+ease(p)*(4+i);ring.scale.setScalar(.3+ease(p)*(1.2+i*.2));});}
  }else if(v==='webcast'){
   for(const x of [-.4,.4]){f.line([[x,1.35,.4],[x*.5,1.7,d*.5],[0,1.25,d]],b,.8);}f.particles(b,[0,1.3,.5],10,1,1,.11);
  }else if(v==='frost'){
   f.runes(b,[0,.045,d],2.4*blast);f.wave(a,[0,.055,d],3.6*blast,0,.6);
   for(let i=0;i<14;i++){const angle=i*2.39996,r=(.5+(i%5)*.45)*blast,ice=f.part('crystal',i%2?a:b,Math.cos(angle)*r,-.5,d+Math.sin(angle)*r,.12+(i%3)*.08,1.5+(i%4)*.25,.16,.65);
    ice.rotation.z=Math.cos(angle)*.22;f.ticks.push((p,t)=>{ice.position.y=-.3+ease(clamp((t-i*.022)*3))*(.9+(i%4)*.2);ice.scale.x=(.10+(i%3)*.05)*blast;});}
   f.particles(c,[0,1.8,d],42,3*blast,1,.19);
  }else if(v==='thing'){
   const palm=f.part('orb',b,0,.18,d,.23,.12,.28,.95,false);
   for(let i=0;i<5;i++){const finger=f.part('hand',b,(i-2)*.08,.2,d+.25,.28,.38,.28,.95,false);finger.rotation.x=.8;f.ticks.push((p,t)=>{finger.position.y=.18+Math.max(0,Math.sin(t*13+i))* .15;});}
   for(let j=0;j<5;j++){const pts=[];for(let i=0;i<=24;i++){const t=i/24,angle=j*Math.PI*.4+t*2;pts.push([Math.cos(angle)*t*1.8,.05+Math.sin(t*4)*.04,d+Math.sin(angle)*t*1.8]);}f.line(pts,a,.55);}f.wave(a,[0,.04,d],2*blast,0,.45);
  }else if(v==='chidori'||v==='thunder'){
   const point=v==='thunder'?[0,1,d]:[0,1.2,d];
   if(v==='thunder'){for(let i=0;i<3;i++)f.bolt([i*.7-.7,14,d-1],point,c,i);f.wave(a,[0,.05,d],4.3*blast,0,.7);}
   for(let i=0;i<9;i++){const angle=i*2.4;f.bolt(point,[Math.cos(angle)*2,1+Math.sin(angle),d+Math.sin(angle)*2],i%2?b:c,i);}
   if(v==='chidori')f.beam([.4,1.2,.4],point,b,.07,.65);f.particles(b,point,30,4,3,.13);
  }else if(v==='howitzer'){
   f.wave(b,[0,.08,d],4*blast,0,.7);f.wave(a,[0,.1,d],3.6*blast,.13,.6);
   for(let i=0;i<5;i++){const flame=f.part('orb',i%2?a:b,Math.cos(i*2.4)*.5,.6+(i%3)*.35,d+Math.sin(i*2.4)*.5,.4,.7,.4,.11);f.ticks.push(p=>flame.scale.setScalar((.4+ease(p)*1.6)*blast));}
   f.particles(a,[0,.7,d],48,5*blast,5,.3);f.particles(0x6a6467,[0,1,d],18,2,2,1.1,true);
  }else if(v==='missiles'){
   for(const x of [-.35,.35]){f.ring(a,x,1.4,.5,.17,.9);f.particles(b,[x,1.4,.5],8,.8,1,.12);}f.runes(a,[0,.04,0],.7);
  }else if(v==='spellcast'){
   const spiral=f.swirl(a,[0,1.4,.7],.23,.5,3,.8);f.ring(b,0,1.4,.7,.4,.7);f.particles(c,[.3,1.4,.5],18,2,2,.12);
  }
 }
 impact(e){const u=e.source;if(!u)return;const f=this.make('impact',u,{x:e.x,z:e.z},e.style==='spiderman'&&e.special?1.25:.48);if(!f)return;const [a,b,c]=ABILITIES[e.style||u.type].palette,d=f.distance;
  if(e.style==='spiderman'&&e.special){
   for(let i=0;i<12;i++){const angle=i*Math.PI/6;f.line([[0,1.2,d],[Math.cos(angle)*.9,1.2+Math.sin(angle)*.9,d]],b,.7);}for(let r=1;r<=3;r++){const pts=[];for(let j=0;j<=24;j++){const an=j*Math.PI/12;pts.push([Math.cos(an)*r*.28,1.2+Math.sin(an)*r*.28,d]);}f.line(pts,b,.6);}
  }else{f.ring(b,0,1.3,d,.14,.65);f.particles(e.style==='ironman'?0xffc88a:b,[0,1.25,d],e.special?12:5,1.7,1.5,.13);if(e.special||e.power>1)f.wave(a,[0,.05,d],Math.min(8,1.5*Math.sqrt(e.power||1)),0,.5);}
 }
 update(dt){this.lastShake*=Math.exp(-12*dt);for(let i=this.effects.length-1;i>=0;i--)if(!this.effects[i].update(dt)){this.effects[i].dispose();this.effects.splice(i,1);}}
}
