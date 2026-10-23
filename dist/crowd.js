import * as T from './vendor/three.module.min.js';
import {character,disposeCharacter} from './models.js?v=0.4';
import {TYPES} from './catalog.js?v=0.4';
import {WORLD} from './world.js?v=0.4';
// Large armies keep the same rounded silhouettes using instanced static poses.
// This changes animation detail, never the number of simulated units.
const cache=new Map(),bodyMaterial=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),markerGeo=new T.RingGeometry(.53,.60,12),markerMat=new T.MeshBasicMaterial({vertexColors:false,side:T.DoubleSide}),haloGeo=new T.TorusGeometry(.38,.035,4,16),haloMat=new T.MeshBasicMaterial({color:0xffdc70});
const dummy=new T.Object3D();const low={SphereGeometry:new T.SphereGeometry(1,8,6),CapsuleGeometry:new T.CapsuleGeometry(1,1,2,6),CylinderGeometry:new T.CylinderGeometry(1,1,1,8),torso:new T.CylinderGeometry(1,.7,1,8),ConeGeometry:new T.ConeGeometry(1,1,6),TorusGeometry:new T.TorusGeometry(1,.1,4,10)};
function merged(type){
 if(cache.has(type))return cache.get(type);
 const model=character(type,'blue');model.updateMatrixWorld(true);const positions=[],normals=[],colors=[];
 function vertex(v,n,c){positions.push(v.x,v.y,v.z);normals.push(n.x,n.y,n.z);colors.push(c.r,c.g,c.b);}
 model.userData.body.traverse(mesh=>{
  if(!mesh.isMesh)return;const normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),map=mesh.material.map;
  if(map?.image?.data){
   const data=map.image.data;const n=new T.Vector3(0,0,1).applyNormalMatrix(normalMatrix);
   for(let y=0;y<32;y++)for(let x=0;x<32;x++){const k=(y*32+x)*4;if(!data[k+3])continue;const color=new T.Color((data[k]<<16)+(data[k+1]<<8)+data[k+2]);const a=x/32*.45-.225,b=y/32*.37-.185,w=.45/32,h=.37/32;
    for(const p of [[a,b],[a+w,b],[a+w,b+h],[a,b],[a+w,b+h],[a,b+h]])vertex(new T.Vector3(p[0],p[1],0).applyMatrix4(mesh.matrixWorld),n,color);
   }return;
  }
  const geometry=mesh.geometry.type==='CylinderGeometry'&&mesh.geometry.parameters.radiusBottom<1?low.torso:low[mesh.geometry.type]||mesh.geometry;const p=geometry.attributes.position,n=geometry.attributes.normal,idx=geometry.index;
  for(let i=0;i<(idx?idx.count:p.count);i++){const k=idx?idx.getX(i):i;vertex(new T.Vector3(p.getX(k),p.getY(k),p.getZ(k)).applyMatrix4(mesh.matrixWorld),new T.Vector3(n.getX(k),n.getY(k),n.getZ(k)).applyNormalMatrix(normalMatrix),mesh.material.color);}
 });
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeBoundingSphere();cache.set(type,geo);disposeCharacter(model);return geo;
}
export class CrowdRenderer{
 constructor(scene,formation){this.scene=scene;this.meshes=[];this.deaths=new Map();const groups=new Map();formation.forEach((u,i)=>{if(!groups.has(u.type))groups.set(u.type,[]);groups.get(u.type).push(i);});
  for(const [type,ids]of groups){const m=new T.InstancedMesh(merged(type),bodyMaterial,ids.length);m.frustumCulled=false;scene.add(m);this.meshes.push({mesh:m,ids});}
  this.markers=new T.InstancedMesh(markerGeo,markerMat,formation.length);this.markers.frustumCulled=false;scene.add(this.markers);
  this.godIds=formation.flatMap((u,i)=>u.god?[i]:[]);if(this.godIds.length){this.halos=new T.InstancedMesh(haloGeo,haloMat,this.godIds.length);this.halos.frustumCulled=false;scene.add(this.halos);}
  this.sync(formation,0);
 }
 sync(units,time){
  for(const {mesh,ids}of this.meshes){ids.forEach((id,j)=>{const u=units[id];let deadTime=0,travel=0,arc=0;if(u.hp===0){if(!this.deaths.has(id))this.deaths.set(id,{time,vx:u.vx||0,vz:u.vz||0});const dead=this.deaths.get(id);deadTime=time-dead.time;travel=(1-Math.exp(-8*deadTime))/8;arc=Math.sin(Math.min(1,deadTime)*Math.PI)*Math.min(4,Math.hypot(dead.vx,dead.vz)*.015);dummy.position.set(Math.max(-WORLD.halfX,Math.min(WORLD.halfX,u.x+dead.vx*travel)),arc,Math.max(-WORLD.halfZ,Math.min(WORLD.halfZ,u.z+dead.vz*travel)));}else dummy.position.set(u.x,Math.sin(time*2+id)*.018,u.z);if(u.hp!==0&&u.lift>0)dummy.position.y+=Math.sin(Math.min(1,(1.6-u.lift)/1.6)*Math.PI)*1.4;dummy.rotation.set(u.casting?.12:0,u.angle??(u.team==='blue'?Math.PI/2:-Math.PI/2),u.hp===0?Math.min(Math.PI/2,deadTime*5):0);dummy.scale.setScalar(u.hp===0&&deadTime>4?0:1);dummy.updateMatrix();mesh.setMatrixAt(j,dummy.matrix);mesh.setColorAt(j,new T.Color(u.god?0xffe0a0:0xffffff));});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}
  units.forEach((u,i)=>{dummy.position.set(u.x,.025,u.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(u.hp===0?0:1);dummy.updateMatrix();this.markers.setMatrixAt(i,dummy.matrix);this.markers.setColorAt(i,new T.Color(u.team==='blue'?0x68d2ff:0xff7976));});this.markers.instanceMatrix.needsUpdate=true;this.markers.instanceColor.needsUpdate=true;
  if(this.halos){this.godIds.forEach((id,j)=>{const u=units[id];dummy.position.set(u.x,2.94*(TYPES[u.type].scale||1),u.z);dummy.rotation.set(Math.PI/2,0,time*.5);dummy.scale.setScalar(u.hp===0?0:(TYPES[u.type].scale||1));dummy.updateMatrix();this.halos.setMatrixAt(j,dummy.matrix);});this.halos.instanceMatrix.needsUpdate=true;}
 }
 dispose(){for(const {mesh}of this.meshes){this.scene.remove(mesh);mesh.dispose();}this.scene.remove(this.markers);this.markers.dispose();if(this.halos){this.scene.remove(this.halos);this.halos.dispose();}}
}
export function projectileHeight(p){return 1.35+(p.style==='ironman'?Math.sin(Math.min(1,(p.age||0)/.8)*Math.PI)*.9:0);}
const styleIndex=type=>type==='ironman'?1:type==='spiderman'?2:type==='elsa'?3:type==='harry'?4:0;
export class ProjectileRenderer{
 constructor(scene){
  this.scene=scene;this.capacity=0;this.missileCapacity=0;
  this.material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexColors:true,uniforms:{uDensity:{value:1}},vertexShader:`attribute float aSize;attribute float aStyle;varying vec3 vColor;varying float vStyle;void main(){vColor=color;vStyle=aStyle;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(aSize*800.0/max(1.0,-mv.z),2.0,48.0);gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uDensity;varying vec3 vColor;varying float vStyle;void main(){vec2 q=gl_PointCoord*2.0-1.0;float r=length(q);if(r>1.0)discard;float glow=exp(-r*r*5.0),core=exp(-r*r*55.0);if(vStyle>1.5&&vStyle<3.5){float a=atan(q.y,q.x);float spokes=pow(abs(cos(a*3.0)),20.0);glow=max(glow*.25,spokes*pow(1.0-r,1.5));}if(vStyle>3.5){glow=max(glow*.5,exp(-abs(q.x)*25.0)*exp(-abs(q.y)*3.0)+exp(-abs(q.y)*25.0)*exp(-abs(q.x)*3.0));}gl_FragColor=vec4(vColor*glow+vec3(core*.9),clamp(glow+core,0.0,1.0)*uDensity);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
  this.trailMaterial=new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.62,depthWrite:false,blending:T.AdditiveBlending});
  this.missileGeometry=new T.CapsuleGeometry(.075,.30,2,6);this.missileMaterial=new T.MeshLambertMaterial({color:0xb5c4ce});this.transform=new T.Object3D();
 }
 sync(projectiles){
  if(projectiles.length>this.capacity){
   if(this.points){this.scene.remove(this.points);this.points.geometry.dispose();this.scene.remove(this.trails);this.trails.geometry.dispose();}
   this.capacity=2**Math.ceil(Math.log2(Math.max(64,projectiles.length)));const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(this.capacity*3),3));g.setAttribute('color',new T.BufferAttribute(new Float32Array(this.capacity*3),3));g.setAttribute('aSize',new T.BufferAttribute(new Float32Array(this.capacity),1));g.setAttribute('aStyle',new T.BufferAttribute(new Float32Array(this.capacity),1));this.points=new T.Points(g,this.material);this.points.frustumCulled=false;this.scene.add(this.points);
   const t=new T.BufferGeometry();t.setAttribute('position',new T.BufferAttribute(new Float32Array(this.capacity*30),3));t.setAttribute('color',new T.BufferAttribute(new Float32Array(this.capacity*30),3));this.trails=new T.LineSegments(t,this.trailMaterial);this.trails.frustumCulled=false;this.scene.add(this.trails);
  }
  if(!this.points)return;
  const activeMissiles=projectiles.reduce((n,p)=>n+(p.style==='ironman'&&p.delay<=0?1:0),0);
  if(activeMissiles>this.missileCapacity){if(this.missiles){this.scene.remove(this.missiles);this.missiles.dispose();}this.missileCapacity=2**Math.ceil(Math.log2(Math.max(8,activeMissiles)));this.missiles=new T.InstancedMesh(this.missileGeometry,this.missileMaterial,this.missileCapacity);this.missiles.frustumCulled=false;this.scene.add(this.missiles);}
  const p=this.points.geometry.attributes.position,c=this.points.geometry.attributes.color,s=this.points.geometry.attributes.aSize,style=this.points.geometry.attributes.aStyle,tp=this.trails.geometry.attributes.position,tc=this.trails.geometry.attributes.color,color=new T.Color(),trail=new T.Color();let n=0,vertices=0,missiles=0;
  for(const shot of projectiles){
   if(shot.delay>0)continue;const height=projectileHeight(shot),type=shot.style||shot.source?.type||'goku';p.setXYZ(n,shot.x,height,shot.z);color.setHex(type==='vegeta'?0xffe48b:shot.color);c.setXYZ(n,color.r,color.g,color.b);s.setX(n,shot.special?.75:.40);style.setX(n,styleIndex(type));
   trail.copy(color);if(type==='ironman')trail.setHex(0xffb765);if(type==='spiderman')trail.setHex(0xb6cbd5);
   const vx=shot.vx||0,vz=shot.vz||0;
   for(let j=0;j<5;j++)for(let k=0;k<2;k++){const t=(j+k)/5,back=t*(shot.special?.22:.14),alpha=(1-t)**1.6;tp.setXYZ(vertices,shot.x-vx*back,height-(type==='ironman'?t*.12:0),shot.z-vz*back);tc.setXYZ(vertices,trail.r*alpha,trail.g*alpha,trail.b*alpha);vertices++;}
   if(type==='ironman'&&this.missiles){const d=this.transform;d.position.set(shot.x,height,shot.z);d.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(vx,0,vz).normalize());d.updateMatrix();this.missiles.setMatrixAt(missiles++,d.matrix);}
   n++;
  }
  for(const attribute of [p,c,s,style,tp,tc])attribute.needsUpdate=true;this.points.geometry.setDrawRange(0,n);this.trails.geometry.setDrawRange(0,vertices);this.material.uniforms.uDensity.value=Math.min(1,Math.sqrt(2000/Math.max(1,n)));
  if(this.missiles){this.missiles.count=missiles;this.missiles.instanceMatrix.needsUpdate=true;}
 }
}
