import * as T from './vendor/three.module.min.js';
import {character,disposeCharacter} from './models.js?v=0.3';
import {TYPES} from './catalog.js?v=0.3';
import {WORLD} from './world.js?v=0.3';
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
  for(const {mesh,ids}of this.meshes){ids.forEach((id,j)=>{const u=units[id];let deadTime=0,travel=0,arc=0;if(u.hp===0){if(!this.deaths.has(id))this.deaths.set(id,{time,vx:u.vx||0,vz:u.vz||0});const dead=this.deaths.get(id);deadTime=time-dead.time;travel=(1-Math.exp(-8*deadTime))/8;arc=Math.sin(Math.min(1,deadTime)*Math.PI)*Math.min(4,Math.hypot(dead.vx,dead.vz)*.015);dummy.position.set(Math.max(-WORLD.halfX,Math.min(WORLD.halfX,u.x+dead.vx*travel)),arc,Math.max(-WORLD.halfZ,Math.min(WORLD.halfZ,u.z+dead.vz*travel)));}else dummy.position.set(u.x,Math.sin(time*2+id)*.018,u.z);dummy.rotation.set(0,u.angle??(u.team==='blue'?Math.PI/2:-Math.PI/2),u.hp===0?Math.min(Math.PI/2,deadTime*5):0);dummy.scale.setScalar(u.hp===0&&deadTime>4?0:1);dummy.updateMatrix();mesh.setMatrixAt(j,dummy.matrix);mesh.setColorAt(j,new T.Color(u.god?0xffe0a0:0xffffff));});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}
  units.forEach((u,i)=>{dummy.position.set(u.x,.025,u.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(u.hp===0?0:1);dummy.updateMatrix();this.markers.setMatrixAt(i,dummy.matrix);this.markers.setColorAt(i,new T.Color(u.team==='blue'?0x68d2ff:0xff7976));});this.markers.instanceMatrix.needsUpdate=true;this.markers.instanceColor.needsUpdate=true;
  if(this.halos){this.godIds.forEach((id,j)=>{const u=units[id];dummy.position.set(u.x,2.94*(TYPES[u.type].scale||1),u.z);dummy.rotation.set(Math.PI/2,0,time*.5);dummy.scale.setScalar(u.hp===0?0:(TYPES[u.type].scale||1));dummy.updateMatrix();this.halos.setMatrixAt(j,dummy.matrix);});this.halos.instanceMatrix.needsUpdate=true;}
 }
 dispose(){for(const {mesh}of this.meshes){this.scene.remove(mesh);mesh.dispose();}this.scene.remove(this.markers);this.markers.dispose();if(this.halos){this.scene.remove(this.halos);this.halos.dispose();}}
}
export class ProjectileRenderer{
 constructor(scene){this.scene=scene;this.capacity=0;this.material=new T.PointsMaterial({size:.27,vertexColors:true,transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false});}
 sync(projectiles){
  if(projectiles.length>this.capacity){if(this.points){this.scene.remove(this.points);this.points.geometry.dispose();}this.capacity=2**Math.ceil(Math.log2(Math.max(64,projectiles.length)));const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(this.capacity*3),3));g.setAttribute('color',new T.BufferAttribute(new Float32Array(this.capacity*3),3));this.points=new T.Points(g,this.material);this.points.frustumCulled=false;this.scene.add(this.points);}
  if(!this.points)return;const p=this.points.geometry.attributes.position,c=this.points.geometry.attributes.color,color=new T.Color();let n=0;
  for(const shot of projectiles){if(shot.delay>0)continue;p.setXYZ(n,shot.x,1.35+Math.sin(shot.id*2.4)*.10,shot.z);color.setHex(shot.color);c.setXYZ(n,color.r,color.g,color.b);n++;}p.needsUpdate=c.needsUpdate=true;this.points.geometry.setDrawRange(0,n);
 }
}
