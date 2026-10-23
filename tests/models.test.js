import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {TYPES} from '../dist/catalog.js';
import {character,disposeCharacter} from '../dist/models.js';
test('all twenty models have rounded bodies, finite geometry and articulated limbs',()=>{
 assert.equal(Object.keys(TYPES).length,20);
 for(const type of Object.keys(TYPES)){
  const model=character(type,'blue');model.updateMatrixWorld(true);const d=model.userData;
  assert.equal(d.arms.length,2);assert.equal(d.forearms.length,2);assert.equal(d.legs.length,2);assert.equal(d.knees.length,2);
  assert.equal(d.head.geometry.type,'SphereGeometry');
  const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
  assert.ok(size.y>1.7&&size.y<3.5,`${type}: height ${size.y}`);
  assert.ok(size.x>0.6&&size.x<3,`${type}: width ${size.x}`);
  model.traverse(part=>{if(part.isMesh){assert.ok(part.material);assert.ok(part.geometry);for(const value of part.matrixWorld.elements)assert.ok(Number.isFinite(value));}});
  disposeCharacter(model);
 }
});
test('old IDs remain valid and every category has distinctive silhouettes',()=>{
 for(const id of ['goku','naruto','luffy'])assert.ok(TYPES[id]);
 for(const c of ['anime','film','series'])assert.ok(Object.values(TYPES).filter(d=>d.category===c).length>=2);
 assert.ok(TYPES.yoda.scale<1);assert.equal(TYPES.vader.ability,'force');assert.equal(TYPES.elsa.ability,'ice');
});

test('every GOD model keeps finite geometry and a distinct halo',()=>{
 for(const type of Object.keys(TYPES)){
  const normal=character(type,'blue'),god=character(type,'red',true);
  assert.equal(god.userData.god,true);
  assert.ok(god.userData.body.children.length>normal.userData.body.children.length);
  assert.ok(god.userData.body.children.some(m=>m.geometry?.type==='TorusGeometry'));
  god.updateMatrixWorld(true);const box=new T.Box3().setFromObject(god);assert.ok(Number.isFinite(box.max.y)&&box.max.y<4);
  disposeCharacter(normal);disposeCharacter(god);
 }
});
