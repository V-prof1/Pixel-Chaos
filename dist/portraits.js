import * as T from './vendor/three.module.min.js';
import {character,disposeCharacter} from './models.js?v=0.4';
// One temporary renderer for all roster portraits. Assets show the actual game meshes.
export function makePortraits(types){
 const r=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setSize(144,170,false);r.setPixelRatio(1);r.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene();scene.add(new T.HemisphereLight(0xe2f6ff,0x45404c,2.5));const sun=new T.DirectionalLight(0xffe6cb,3);sun.position.set(-3,5,4);scene.add(sun);
 const camera=new T.OrthographicCamera(-1.02,1.02,1.20,-1.20,.1,20);camera.position.set(3,2.05,7);camera.lookAt(0,1.72,0);
 const result={};
 for(const type of Object.keys(types)){
  const model=character(type,'blue');model.userData.ring.visible=false;model.userData.shadow.visible=false;model.userData.bar.visible=model.userData.barBack.visible=false;
  if(types[type].scale){model.userData.body.scale.setScalar(.92);}
  model.rotation.y=-.18;scene.add(model);r.render(scene,camera);result[type]=r.domElement.toDataURL('image/png');scene.remove(model);disposeCharacter(model);
 }
 r.dispose();r.forceContextLoss();return result;
}
