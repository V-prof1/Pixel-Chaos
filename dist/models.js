import * as T from './vendor/three.module.min.js';
import {TYPES} from './catalog.js?v=0.4';
// Shared rounded meshes: only the pixel face/details retain hard edges.
const geo={sphere:new T.SphereGeometry(1,16,12),capsule:new T.CapsuleGeometry(1,1,4,10),torso:new T.CylinderGeometry(1,.70,1,14),cylinder:new T.CylinderGeometry(1,1,1,14),cone:new T.ConeGeometry(1,1,10),face:new T.PlaneGeometry(.45,.37),plane:new T.PlaneGeometry(1,1),box:new T.BoxGeometry(1,1,1),ring:new T.RingGeometry(.53,.58,24),shadow:new T.CircleGeometry(.52,20),torus:new T.TorusGeometry(1,.10,6,20)};
const materials=new Map(),faces=new Map();
function material(color){if(!materials.has(color))materials.set(color,new T.MeshLambertMaterial({color}));return materials.get(color);}
function part(parent,shape,color,x,y,z,sx,sy,sz){const mesh=new T.Mesh(geo[shape],material(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;}
function ball(parent,color,x,y,z,sx,sy,sz){return part(parent,'sphere',color,x,y,z,sx,sy,sz);}
function segment(parent,color,x,y,z,r,length,depth=r){return part(parent,'capsule',color,x,y,z,r,length/3,depth);}
function band(parent,color,y,r=.3,h=.08){return part(parent,'cylinder',color,0,y,0,r,h,r*.8);}
function faceMaterial(type){
 if(faces.has(type))return faces.get(type);
 const data=new Uint8Array(32*32*4);const paint=(c,x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){const k=(j*32+i)*4;data[k]=c>>16&255;data[k+1]=c>>8&255;data[k+2]=c&255;data[k+3]=255;}};
 const ink=0x242332;
 for(const x of [7,20]){paint(0xf8f5e9,x,14,6,3);paint(type==='elsa'?0x579dcb:ink,x+2,14,2,3);paint(ink,x,19,6,1);}
 paint(0xa86964,14,7,5,1);
 if(type==='naruto')for(const x of [3,24])for(const y of [9,12])paint(0x775443,x,y,5,1);
 if(type==='luffy'){paint(0x795049,21,10,5,1);paint(0x795049,23,9,1,3);}
 if(type==='tanjiro'){paint(0x9a414b,20,22,6,6);paint(0x9a414b,24,20,4,6);}
 if(type==='gojo')paint(0x111625,0,12,32,10);
 if(type==='spiderman'){paint(0x182234,3,10,11,12);paint(0x182234,18,10,11,12);paint(0xf4f2de,5,12,7,8);paint(0xf4f2de,20,12,7,8);paint(0x283044,15,0,1,31);for(const y of [7,23,28])paint(0x283044,1,y,30,1);}
 if(type==='vader'){paint(0x151923,3,13,11,5);paint(0x151923,18,13,11,5);paint(0x596775,12,3,8,7);for(let x=13;x<20;x+=2)paint(0x131923,x,3,1,5);paint(0x56616a,14,11,4,2);}
 if(type==='eleven'){paint(0x963940,17,7,1,5);paint(0x963940,18,6,1,3);}
 const texture=new T.DataTexture(data,32,32,T.RGBAFormat);texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;
 const m=new T.MeshLambertMaterial({map:texture,transparent:true,alphaTest:.1,depthWrite:false});faces.set(type,m);return m;
}
function capeGeometry(){const vertices=[],indices=[];for(let y=0;y<=6;y++)for(let x=0;x<=8;x++){const v=y/6,u=x/8;vertices.push((u-.5)*(.68+.55*v),1.85-v*1.62,-.18-.26*v-.16*Math.sin(u*Math.PI));}for(let y=0;y<6;y++)for(let x=0;x<8;x++){const i=y*9+x;indices.push(i,i+9,i+1,i+1,i+9,i+10);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;}
const capeGeo=capeGeometry(),capeMats=new Map();
function cape(parent,color){if(!capeMats.has(color))capeMats.set(color,new T.MeshLambertMaterial({color,side:T.DoubleSide}));const m=new T.Mesh(capeGeo,capeMats.get(color));parent.add(m);return m;}
function hairSpikes(parent,color,count=7,height=.30){for(let i=0;i<count;i++){const a=(i/count-.5)*3.5;const m=part(parent,'cone',color,Math.sin(a)*.22,2.57+Math.cos(a)*.025,-.04+Math.cos(a)*.04,.11,height,.11);m.rotation.z=-Math.sin(a)*.48;m.rotation.x=-.15;}}
function sword(parent,color=0xc8d8d9,saber=false){const g=new T.Group();g.position.set(0,-.40,.08);parent.add(g);segment(g,0x444550,0,.08,0,.045,.22);part(g,'cylinder',0x9a9ba0,0,.21,0,.12,.035,.075);const blade=part(g,saber?'capsule':'torso',color,0,.87,0,saber?.035:.065,saber?.42:1.25,saber?.035:.024);if(!saber)blade.rotation.z=Math.PI;return g;}
export function character(type,team,god=false){
 const d=TYPES[type];if(!d)throw Error('Unknown character '+type);
 const root=new T.Group(),body=new T.Group();root.add(body);const scale=d.scale||1;body.scale.setScalar(scale);
 const shadow=new T.Mesh(geo.shadow,new T.MeshBasicMaterial({color:0x13281e,transparent:true,opacity:.23,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;root.add(shadow);
 const ring=new T.Mesh(geo.ring,new T.MeshBasicMaterial({color:team==='blue'?0x68d2ff:0xff7976,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.022;root.add(ring);
 const feminine=['elsa','eleven','wednesday'].includes(type),width=feminine?.31:.38;
 part(body,'torso',d.shirt,0,1.54,0,width,.65,.24);
 ball(body,d.shirt,0,1.79,0,width,.16,.235);
 ball(body,d.pants,0,1.14,0,.27,.18,.20);
 part(body,'cylinder',type==='goku'?d.accent:0x333540,0,1.23,0,.27,.07,.205);
 segment(body,d.skin,0,1.97,0,.115,.18,.1);
 const head=ball(body,d.skin,0,2.23,.015,.264,.318,.252);
 if(!['spiderman','vader'].includes(type))for(const side of [-1,1])ball(body,d.skin,side*.269,2.22,0,.05,.08,.045);
 const face=new T.Mesh(geo.face,faceMaterial(type));face.position.set(0,2.23,.273);body.add(face);
 const arms=[],legs=[],forearms=[],knees=[];
 for(const side of [-1,1]){
  const arm=new T.Group();arm.position.set(side*(width+.07),1.80,0);arm.rotation.z=side*.12;body.add(arm);arms.push(arm);
  const bare=['goku','luffy'].includes(type),armColor=bare?d.skin:d.shirt;
  ball(arm,armColor,0,-.05,0,.13,.14,.13);
  segment(arm,armColor,0,-.21,0,.105,.40,.105);
  const fore=new T.Group();fore.position.y=-.40;fore.rotation.x=-.10;arm.add(fore);forearms.push(fore);
  ball(fore,armColor,0,0,0,.093,.10,.093);
  segment(fore,['goku','naruto','luffy','tanjiro','elsa','eleven','wednesday'].includes(type)?d.skin:d.shirt,0,-.16,.015,.085,.34,.085);
  ball(fore,d.skin,0,-.36,.03,.087,.105,.07);
  if(['goku','naruto'].includes(type))part(fore,'cylinder',d.accent,0,-.27,.018,.092,.10,.092);
  const leg=new T.Group();leg.position.set(side*.15,1.12,0);body.add(leg);legs.push(leg);
  segment(leg,d.pants,0,-.23,0,.128,.49,.12);
  const knee=new T.Group();knee.position.y=-.47;leg.add(knee);knees.push(knee);
  ball(knee,d.pants,0,0,0,.106,.115,.11);
  segment(knee,type==='luffy'?d.skin:d.pants,0,-.21,0,.091,.43,.095);
  ball(knee,type==='luffy'?0x6d573f:0x242c3c,0,-.50,.07,.11,.075,.195);
 }
 if(!['spiderman','vader','yoda','saitama','ironman'].includes(type)){
  const scalp=ball(body,d.hair,0,2.40,-.035,.273,.22,.255);
  if(['elsa','eleven','wednesday'].includes(type)){scalp.scale.y=.25;for(const side of [-1,1])ball(body,d.hair,side*.23,2.24,-.06,.075,.27,.14);}
 }
 if(type==='goku'){
  hairSpikes(body,d.hair,7,.37);
  for(const side of [-1,1]){const v=part(body,'torso',d.accent,side*.10,1.79,.222,.055,.32,.022);v.rotation.z=side*.47;}
  part(body,'cylinder',d.accent,0,1.24,0,.29,.10,.22);
  const emblem=part(body,'cylinder',0xf4e8ce,.21,1.62,.237,.076,.012,.076);emblem.rotation.x=Math.PI/2;
  part(body,'box',0x242b35,.21,1.62,.247,.065,.02,.01);
 }
 if(type==='naruto'){
  hairSpikes(body,d.hair,9,.21);band(body,0x2d4056,2.40,.278,.09);
  part(body,'box',0xaebdc2,0,2.40,.245,.20,.074,.02);part(body,'box',0x42505a,0,2.40,.259,.073,.022,.012);
  part(body,'box',0xe4a34c,0,1.56,.247,.025,.50,.015);
  for(const side of [-1,1])part(body,'torso',d.accent,side*.24,1.48,.11,.095,.48,.17);
  segment(body,0x334458,0,1.50,-.31,.15,.36,.11);
 }
 if(type==='luffy'){
  band(body,0xe6cf8b,2.51,.43,.045);band(body,0xe2c780,2.60,.27,.16);band(body,0xb6414a,2.54,.28,.045);
  part(body,'torso',d.skin,0,1.58,.24,.12,.55,.022);
  for(const side of [-1,1])part(body,'torso',d.shirt,side*.21,1.56,.20,.10,.61,.06);
  for(let i=0;i<3;i++)ball(body,0xf0d18a,.20,1.40+i*.12,.26,.021,.021,.015);
  for(const side of [-1,1])part(body,'cylinder',0xe9dcc0,side*.15,.79,0,.13,.10,.12);
  part(body,'box',0xb58c68,-.07,1.49,.267,.10,.014,.012);
 }
 if(type==='gojo'){
  hairSpikes(body,d.hair,9,.27);band(body,0x151b2b,2.28,.274,.12);band(body,0x2c3451,1.91,.18,.19);
  part(body,'box',0x151b2b,0,2.27,.27,.46,.12,.02);
 }
 if(type==='ichigo'){
  hairSpikes(body,d.hair,8,.20);
  for(const side of [-1,1]){part(body,'torso',d.accent,side*.07,1.76,.23,.035,.29,.018).rotation.z=side*.45;}
  part(body,'cone',d.shirt,0,.87,0,.42,.72,.30);band(body,d.accent,1.26,.29,.10);
  sword(forearms[1]);
 }
 if(type==='tanjiro'){
  hairSpikes(body,d.hair,7,.18);
  for(const side of [-1,1]){
   part(body,'torso',d.accent,side*.245,1.53,.03,.15,.76,.27);
   for(let y=0;y<4;y++)for(let x=0;x<2;x++)if((x+y)%2===0)part(body,'box',0x263b38,side*(.13+x*.13),1.26+y*.17,.278,.12,.16,.018);
   part(body,'box',0xe4d7bd,side*.29,2.08,.01,.046,.16,.018);
  }
  band(body,0xddcfb7,1.24,.27,.07);sword(forearms[1]);
 }
 if(type==='vader'){
  ball(body,0x1c2430,0,2.36,-.025,.32,.26,.29);
  part(body,'torso',0x252e3a,0,2.16,.02,.32,.39,.28).rotation.z=Math.PI;
  face.position.z=.308;
  part(body,'box',0x465561,0,1.61,.25,.24,.22,.035);
  for(let i=0;i<3;i++)part(body,'box',i%2?0xd6dce2:0xc74a50,-.07+i*.07,1.61,.276,.04,.045,.013);
  cape(body,0x131a25);sword(forearms[1],0xff5968,true);
 }
 if(type==='yoda'){
  for(const side of [-1,1]){const ear=part(body,'cone',d.skin,side*.43,2.26,0,.15,.57,.09);ear.rotation.z=-side*Math.PI/2;}
  ball(body,d.hair,0,2.46,-.1,.22,.08,.19);
  part(body,'cone',d.shirt,0,1.10,0,.47,1.16,.34);band(body,0x776950,1.39,.29,.08);
  for(const side of [-1,1])part(body,'torso',0xd4c8a3,side*.12,1.65,.23,.07,.45,.025).rotation.z=side*.3;
  sword(forearms[1],0x8cff7d,true);
 }
 if(type==='spiderman'){
  const spider=part(body,'sphere',0x202c42,0,1.64,.252,.06,.095,.015);
  for(const side of [-1,1])for(let i=0;i<3;i++)part(body,'box',0x26334a,side*.095,1.59+i*.05,.253,.12,.012,.012).rotation.z=side*(.3+i*.4);
  for(const side of [-1,1]){ball(body,d.accent,side*.29,1.48,0,.09,.18,.23);}
 }
 if(type==='elsa'){
  part(body,'cone',d.pants,0,.68,0,.43,1.25,.34);
  part(body,'torso',0x94dce8,0,1.68,.10,.28,.37,.20);
  cape(body,0x89bdd1);
  for(let i=0;i<7;i++)ball(body,d.hair,.22+Math.sin(i)*.015,2.25-i*.10,-.04,.065,.073,.065);
  for(let i=0;i<4;i++)part(body,'cone',0xd5f6fd,(i-1.5)*.085,2.53,.14,.036,.12,.03);
 }
 if(type==='eleven'){
  part(body,'cone',d.shirt,0,1.04,0,.38,.68,.28);
  for(const side of [-1,1])part(body,'torso',d.accent,side*.22,1.62,.09,.12,.55,.23);
  part(body,'box',0xf3e9d9,0,1.84,.23,.28,.07,.022);
  for(const leg of legs)segment(leg,d.skin,0,-.24,0,.116,.43,.11);
 }
 if(type==='wednesday'){
  part(body,'cone',d.pants,0,1.01,0,.35,.67,.26);
  for(const side of [-1,1]){
   part(body,'cone',d.accent,side*.09,1.83,.24,.10,.17,.018).rotation.z=side*.5;
   for(let i=0;i<7;i++)ball(body,d.hair,side*(.24+Math.sin(i*2)*.018),2.27-i*.105,-.045,.05,.067,.047);
  }
  for(let i=0;i<4;i++)ball(body,0xb9b7c0,0,1.68-i*.105,.253,.013,.013,.009);
 }

 if(type==='vegeta'){
  hairSpikes(body,d.hair,8,.37);
  part(body,'torso',d.accent,0,1.60,.14,.32,.47,.19);
  for(const side of [-1,1]){part(body,'torso',0xc0a46e,side*.25,1.77,.03,.11,.19,.27);ball(forearms[side===-1?0:1],0xf0ebda,0,-.31,.025,.10,.17,.09);}
  part(body,'box',0xb79b68,0,1.51,.339,.44,.18,.018);
 }
 if(type==='sasuke'){
  hairSpikes(body,d.hair,7,.29);band(body,d.accent,1.21,.29,.12);
  const tie=part(body,'torus',d.accent,0,1.20,.15,.1,.1,.1);
  part(body,'torso',d.skin,0,1.81,.23,.08,.26,.018);sword(forearms[1]);
 }
 if(type==='saitama'){
  cape(body,0xe3e6e0);band(body,0x262e35,1.22,.28,.08);
  for(const fore of forearms)ball(fore,d.accent,0,-.28,.03,.115,.20,.11);
  for(const leg of legs)segment(leg,d.accent,0,-.77,.01,.10,.43,.11);
  part(body,'box',0xc5cbd0,0,1.60,.245,.025,.48,.018);
 }
 if(type==='bakugo'){
  hairSpikes(body,d.hair,10,.25);
  for(const side of [-1,1]){const strap=part(body,'box',d.accent,side*.12,1.58,.25,.08,.57,.035);strap.rotation.z=side*.45;}
  for(const fore of forearms){part(fore,'cylinder',0x60735c,0,-.23,0,.16,.34,.16);band(fore,0x2d3936,-.32,.17,.07);}
  part(body,'box',0x232e35,0,2.27,.28,.47,.12,.02);
 }
 if(type==='ironman'){
  ball(body,0xc49c55,0,2.24,.15,.23,.25,.16);
  for(const side of [-1,1])part(body,'box',0xc4f9ff,side*.10,2.29,.309,.12,.035,.015);
  const reactor=part(body,'cylinder',0xc0f5ff,0,1.66,.255,.085,.025,.085);reactor.rotation.x=Math.PI/2;
  for(const fore of forearms)segment(fore,d.accent,0,-.15,.03,.095,.24,.09);
  for(const side of [-1,1])ball(body,d.accent,side*.15,.91,.09,.13,.16,.07);
 }
 if(type==='thor'){
  cape(body,d.accent);for(const side of [-1,1])for(const y of [1.69,1.43])ball(body,0xb6c2c9,side*.20,y,.235,.09,.09,.045);
  ball(body,d.hair,0,2.05,.16,.18,.10,.10);
  const hammer=new T.Group();hammer.position.set(0,-.4,.08);forearms[1].add(hammer);segment(hammer,0x796352,0,.14,0,.035,.45);part(hammer,'box',0xa7b7be,0,.45,0,.36,.24,.22);
 }
 if(type==='harry'){
  cape(body,0x202430);part(body,'torso',0xaeb6bd,0,1.67,.24,.20,.32,.02);
  for(const side of [-1,1]){const glasses=part(body,'torus',0x30313b,side*.12,2.25,.282,.083,.083,.025);}
  part(body,'box',0x30313b,0,2.25,.287,.07,.015,.018);
  part(body,'box',d.accent,0,1.69,.267,.065,.29,.015);
  segment(forearms[1],0x735544,0,-.13,.20,.017,.55,.017).rotation.x=.5;
  part(body,'box',0x9c5655,.11,2.44,.25,.025,.08,.008).rotation.z=.4;
 }
 if(type==='geralt'){
  ball(body,d.hair,0,2.37,-.11,.27,.22,.20);segment(body,d.hair,0,2.13,-.22,.11,.31,.10);
  for(const side of [-1,1])part(body,'torso',0x62696a,side*.20,1.63,.13,.13,.42,.18);
  part(body,'box',0x948574,0,1.53,.27,.05,.52,.025).rotation.z=.6;sword(forearms[1]);
  part(body,'box',0x9f7972,.13,2.25,.279,.018,.17,.01);
 }
 if(god){
  const halo=part(body,'torus',0xffdb69,0,2.94,0,.38,.38,.38);halo.rotation.x=Math.PI/2;
  for(let i=-1;i<=1;i++)part(body,'cone',0xffd25c,i*.12,2.70,.02,.06,.20,.06);
 }
 const h=(god?3.18:2.94)*scale;
 const barBack=part(root,'box',0x1c2d32,0,h,0,.7,.06,.04),bar=part(root,'box',team==='blue'?0x68d2ff:0xff7976,0,h+.001,.025,.68,.038,.02);
 root.userData={body,arms,legs,forearms,knees,head,bar,barBack,ring,shadow,type,scale,god};
 return root;
}
export function disposeCharacter(root){root.userData.shadow.material.dispose();root.userData.ring.material.dispose();}
