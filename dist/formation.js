import {TYPES,unitCost} from './catalog.js?v=0.3';
import {WORLD} from './world.js?v=0.3';
export function validFormation(value){return Array.isArray(value)?value.filter(f=>f&&Object.hasOwn(TYPES,f.type)&&['blue','red'].includes(f.team)&&Number.isFinite(f.x)&&Number.isFinite(f.z)&&Math.abs(f.x)<=WORLD.halfX&&Math.abs(f.z)<=WORLD.halfZ).map(f=>({type:f.type,team:f.team,x:f.x,z:f.z,god:f.god===true})):[];}
export function placeGroup(formation,{type,team,x,z,god=false,amount=1,budget=Infinity}){
 if(!Object.hasOwn(TYPES,type)||!Number.isSafeInteger(amount)||amount<1)return {added:0,reason:'Quantidade inválida.'};
 const spacing=.95,occupied=new Map(),key=(x,z)=>`${x},${z}`;
 for(const u of formation){const k=key(Math.floor(u.x),Math.floor(u.z));if(!occupied.has(k))occupied.set(k,[]);occupied.get(k).push(u);}
 let remaining=budget-formation.filter(u=>u.team===team).reduce((s,u)=>s+unitCost(u.type,u.god),0),added=0;
 const free=(px,pz)=>{const a=Math.floor(px),b=Math.floor(pz);for(let i=a-1;i<=a+1;i++)for(let j=b-1;j<=b+1;j++)for(const u of occupied.get(key(i,j))||[])if(Math.hypot(u.x-px,u.z-pz)<.85)return false;return true;};
 const insert=(px,pz)=>{
  if(px< -WORLD.halfX||px>WORLD.halfX||Math.abs(pz)>WORLD.halfZ||(team==='blue'?px>-.5:px<.5)||!free(px,pz))return;
  const price=unitCost(type,god);if(remaining<price)return;remaining-=price;const u={type,team,x:px,z:pz,god};formation.push(u);const k=key(Math.floor(px),Math.floor(pz));if(!occupied.has(k))occupied.set(k,[]);occupied.get(k).push(u);added++;
 };
 insert(x,z);
 if(amount>1){
  // Scan only physical placement space; there is no unit-count ceiling.
  const candidates=[];
  for(let px=team==='blue'?-WORLD.halfX:spacing;px<=(team==='blue'?-.5:WORLD.halfX);px+=spacing)for(let pz=-WORLD.halfZ;pz<=WORLD.halfZ;pz+=spacing)candidates.push([px,pz]);
  candidates.sort((a,b)=>(a[0]-x)**2+(a[1]-z)**2-((b[0]-x)**2+(b[1]-z)**2));
  for(const [px,pz]of candidates){if(added>=amount||remaining<unitCost(type,god))break;insert(px,pz);}
 }
 return {added,reason:added<amount?(remaining<unitCost(type,god)?'Orçamento insuficiente.':'Não há espaço livre nessa região do time.'):'',remaining};
}
