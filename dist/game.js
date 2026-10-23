import * as T from './vendor/three.module.min.js';
import {TYPES,CHALLENGES,Battle} from './sim.js?v=0.2';
import {CATEGORIES} from './catalog.js?v=0.2';
import {character,disposeCharacter} from './models.js?v=0.2';
import {makePortraits} from './portraits.js?v=0.2';
const $=id=>document.getElementById(id),canvas=$('world');
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('error').hidden=false;throw e;}
renderer.setClearColor(0x14292e);renderer.outputColorSpace=T.SRGBColorSpace;renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
const scene=new T.Scene();scene.fog=new T.FogExp2(0x14292e,.018);const camera=new T.PerspectiveCamera(42,1,.1,180);scene.add(new T.HemisphereLight(0xd5f6ec,0x384956,2.4));const sun=new T.DirectionalLight(0xffe3a9,2.6);sun.position.set(-8,18,8);scene.add(sun);
const mats=new Map(),box=new T.BoxGeometry(1,1,1),sphere=new T.IcosahedronGeometry(1,1),cylinder=new T.CylinderGeometry(1,1,1,12);
function mat(color){if(!mats.has(color))mats.set(color,new T.MeshLambertMaterial({color}));return mats.get(color);}
function cube(parent,color,x,y,z,w,h,d){const m=new T.Mesh(box,mat(color));m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
function mesh(parent,geo,color,x,y,z,sx,sy,sz){const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
// Nearest-filtered procedural ground texture, generated locally.
const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=64;const ctx=texCanvas.getContext('2d');ctx.fillStyle='#658b69';ctx.fillRect(0,0,64,64);let seed=92;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<380;i++){ctx.fillStyle=['#719573','#557b5e','#7d9b70','#638667'][i%4];ctx.fillRect(rnd()*64|0,rnd()*64|0,1+(rnd()*3|0),1+(rnd()*2|0));}const texture=new T.CanvasTexture(texCanvas);texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(12,8);texture.colorSpace=T.SRGBColorSpace;
const ground=new T.Mesh(new T.BoxGeometry(25,.5,17),new T.MeshLambertMaterial({map:texture,color:0xb6bf96}));ground.position.y=-.3;scene.add(ground);cube(scene,0x3b5149,0,-1.05,0,25,1.1,17);cube(scene,0x2d3f3d,0,-1.9,0,23,.65,15.3);
const grid=new T.GridHelper(24,24,0xd4dfab,0x89aa82);grid.position.y=-.037;grid.scale.z=16/24;grid.material.transparent=true;grid.material.opacity=.19;scene.add(grid);
const boundary=new T.Mesh(new T.PlaneGeometry(.06,16),new T.MeshBasicMaterial({color:0xffe9a0,transparent:true,opacity:.65}));boundary.rotation.x=-Math.PI/2;boundary.position.y=.006;scene.add(boundary);
for(const side of [-1,1]){const strip=new T.Mesh(new T.PlaneGeometry(.16,16.8),new T.MeshBasicMaterial({color:side<0?0x65c6fc:0xff7a78}));strip.rotation.x=-Math.PI/2;strip.position.set(side*12.3,-.025,0);scene.add(strip);for(const z of [-8.3,8.3]){cube(scene,0x39494b,side*12.25,.25,z,.5,.7,.5);cube(scene,side<0?0x65c6fc:0xff7a78,side*12.25,.8,z,.2,.6,.2);}}
for(let i=0;i<33;i++){const x=(rnd()-.5)*70,z=-15-rnd()*24;const peak=mesh(scene,new T.ConeGeometry(1,1,4),[0x29494a,0x355655,0x43635d][i%3],x,-1,z,4+rnd()*6,6+rnd()*11,4+rnd()*5);peak.rotation.y=rnd()*2;}
function tree(x,z,s){const g=new T.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(s);cube(g,0x6f6352,0,.7,0,.25,1.4,.25);cube(g,0x52725c,0,1.9,0,1.3,1.3,1.2);cube(g,0x678569,.2,2.6,0,.9,.6,.9);cube(g,0x3e6556,-.4,1.6,.1,.8,.8,.8);}
for(let i=0;i<18;i++){const x=(rnd()-.5)*36;tree(x,-10-rnd()*4,.6+rnd());}for(let i=0;i<10;i++){const side=i%2?-1:1,x=side*(14+rnd()*4),z=(rnd()-.5)*20;tree(x,z,.6+rnd()*.6);}
let category='all',query='';
let formation=[],views=[],battle=null,selected='goku',team='blue',erase=false,mode='sandbox',level=0,paused=false,speed=1,sound=false,audio,orbit=false,quality=false,last=0,acc=0,elapsed=0,animationClock=0;let azimuth=.32,elevation=.87,distance=31;const target=new T.Vector3(0,0,0);const effects=[];const waveGeo=new T.TorusGeometry(1,.05,6,32),webGeo=new T.IcosahedronGeometry(1.1,1),crystalGeo=new T.ConeGeometry(1,1,5);
const webMat=new T.MeshLambertMaterial({color:0xe7f2f0,wireframe:true});let progress=0;try{progress=Number(localStorage.getItem('pixelChaos.progress.v1'))||0;}catch{}
function cameraUpdate(){camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(target);}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<innerHeight?53:42;target.y=innerWidth<innerHeight?-1.8:0;camera.updateProjectionMatrix();cameraUpdate();}addEventListener('resize',resize);resize();
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
function beep(freq=220,len=.06){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.45,audio.currentTime+len);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+len);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+len);}catch{}}
function clearViews(){for(const v of views){scene.remove(v);disposeCharacter(v);}views=[];for(const e of effects){scene.remove(e.mesh);if(e.kind==='clone'){disposeCharacter(e.mesh);}}effects.length=0;}
function rebuild(){clearViews();formation.forEach(f=>{const v=character(f.type,f.team);v.position.set(f.x,0,f.z);v.rotation.y=f.team==='blue'?Math.PI/2:-Math.PI/2;scene.add(v);views.push(v);});updateUI();save();}
function save(){if(mode!=='sandbox')return;try{localStorage.setItem('pixelChaos.formation.v1',JSON.stringify(formation));}catch{}}
function cost(t){return formation.filter(f=>f.team===t).reduce((n,f)=>n+TYPES[f.type].cost,0);}
function updateUI(){for(const t of ['blue','red']){$(t+'Count').textContent=(battle?battle.units.filter(u=>u.team===t&&u.hp>0):formation.filter(f=>f.team===t)).length;$(t+'Cost').textContent=cost(t)+' moedas';}$('teamBlue').classList.toggle('active',team==='blue');$('teamRed').classList.toggle('active',team==='red');$('erase').classList.toggle('active',erase);$('erase').textContent='Apagar: '+(erase?'sim':'não');$('teamRed').disabled=mode==='campaign';$('modeInfo').textContent=mode==='sandbox'?'SANDBOX · ATÉ 40 LUTADORES':`${level+1}/5 · ${CHALLENGES[level].name.toUpperCase()} · ${cost('blue')}/${CHALLENGES[level].budget} MOEDAS`;$('fight').disabled=!!battle;$('sandbox').classList.toggle('active',mode==='sandbox');$('campaign').classList.toggle('active',mode==='campaign');$('arenaHint').textContent=battle?(paused?'BATALHA PAUSADA':`BATALHA EM ANDAMENTO · ${Math.floor(battle.time)}s`):erase?'TOQUE EM UM LUTADOR PARA REMOVER':orbit?'ARRASTE PARA GIRAR A CÂMERA':`TOQUE NO LADO ${team==='blue'?'AZUL':'VERMELHO'} PARA POSICIONAR`;$('camera').classList.toggle('active',orbit);}
const portraits=makePortraits(TYPES);
function selectCharacter(id){if(battle)return;selected=id;erase=false;renderRoster();updateUI();beep(420);}
function renderRoster(){
 const roster=$('roster');const scroll=roster.scrollLeft;roster.replaceChildren();
 const entries=Object.entries(TYPES).filter(([id,d])=>(category==='all'||d.category===category)&&`${d.name} ${d.series}`.toLocaleLowerCase('pt-BR').includes(query));
 for(const [id,d]of entries){
  const b=document.createElement('button');b.className='unitcard'+(id===selected?' selected':'');b.setAttribute('aria-pressed',String(id===selected));b.setAttribute('aria-label',`${d.name}, ${d.series}, ${d.cost} moedas`);
  b.innerHTML=`<img class="portrait" src="${portraits[id]}" alt=""><span><strong>${d.name}</strong><small>${d.series}</small><em>◈ ${d.cost}</em></span>`;b.title=`${d.power} · ${d.hp} de vida`;b.onclick=()=>selectCharacter(id);b.disabled=!!battle;roster.append(b);
 }
 if(!entries.length){const p=document.createElement('p');p.className='emptyRoster';p.textContent='Nenhum personagem encontrado.';roster.append(p);}
 roster.scrollLeft=scroll;
 const d=TYPES[selected];$('selectedName').textContent=d.name;$('selectedSeries').textContent=d.series;$('selectedPower').textContent=d.power;
 $('selectedStats').textContent=`${d.hp} PV · ${d.damage} ATQ · ${d.cost} moedas`;
 $('selectedPortrait').src=portraits[selected];
 document.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',b.dataset.category===category));
}
for(const [id,label]of Object.entries(CATEGORIES)){const b=document.createElement('button');b.textContent=label;b.dataset.category=id;b.onclick=()=>{category=id;renderRoster();};$('categories').append(b);}
$('search').oninput=e=>{query=e.target.value.toLocaleLowerCase('pt-BR').trim();renderRoster();};renderRoster();
function add(type,t,x,z){if(formation.length>=40){toast('Limite de 40 lutadores nesta versão.');return false;}if(mode==='campaign'&&t==='blue'&&cost('blue')+TYPES[type].cost>CHALLENGES[level].budget){toast('Orçamento insuficiente. Remova alguém ou escolha outro lutador.');return false;}if(formation.some(f=>Math.hypot(f.x-x,f.z-z)<.9)){toast('Deixe um pouco de espaço entre os lutadores.');return false;}formation.push({type,team:t,x,z});return true;}
function demo(){if(battle)return;formation=mode==='campaign'?formation.filter(f=>f.team==='red'):[];if(mode==='campaign'){for(const[type,x,z]of [['goku',-4,-2],['naruto',-3,1],['naruto',-5,3],['luffy',-6,-3]])if(cost('blue')+TYPES[type].cost<=CHALLENGES[level].budget)add(type,'blue',x,z);}else for(const t of ['blue','red'])for(let i=0;i<6;i++)add((t==='blue'?['goku','gojo','spiderman','tanjiro','yoda','elsa']:['vader','naruto','ichigo','luffy','eleven','wednesday'])[i],t,(t==='blue'?-1:1)*(3+Math.floor(i/3)*2.5),(i%3-1)*3+(t==='red'?.4:0));rebuild();toast('Formação pronta. Inicie a batalha!');}
function loadChallenge(){formation=CHALLENGES[level].enemies.map(([type,x,z])=>({type,x,z,team:'red'}));team='blue';erase=false;rebuild();toast(`Desafio ${level+1}: ${CHALLENGES[level].name}`);}
function stop(){battle=null;paused=false;$('pause').textContent='Ⅱ';$('pause').disabled=true;$('fight').hidden=false;$('reset').hidden=true;document.body.classList.remove('battling');renderRoster();rebuild();}
function setMode(m){if(battle)stop();if(mode==='sandbox')save();mode=m;if(m==='campaign'){level=Math.min(progress,4);loadChallenge();}else{try{formation=validFormation(JSON.parse(localStorage.getItem('pixelChaos.formation.v1')||'[]'));}catch{formation=[];}rebuild();if(!formation.length)demo();}}
function validFormation(v){return Array.isArray(v)?v.filter(f=>TYPES[f.type]&&['blue','red'].includes(f.team)&&Number.isFinite(f.x)&&Number.isFinite(f.z)&&Math.abs(f.x)<=11&&Math.abs(f.z)<=7).slice(0,40):[];}
function burst(x,z,color,number=6){for(let i=0;i<number;i++){const m=mesh(scene,box,color,x,.8,z,.12,.12,.12);effects.push({mesh:m,ttl:.45,max:.45,vx:(Math.random()-.5)*7,vy:2+Math.random()*4,vz:(Math.random()-.5)*7,kind:'particle'});}}
function lineEffect(from,to,color,thickness=.035,life=.4){
 const a=new T.Vector3(from.x,1.35,from.z),b=new T.Vector3(to.x,1.35,to.z),delta=b.clone().sub(a);
 const m=mesh(scene,cylinder,color,(a.x+b.x)/2,1.35,(a.z+b.z)/2,thickness,delta.length(),thickness);
 m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());effects.push({mesh:m,ttl:life,max:life,kind:'beam'});
}
function orbEffect(x,z,color,size=.9,kind='ball'){
 const m=mesh(scene,sphere,color,x,1.1,z,size,size,size);effects.push({mesh:m,ttl:.6,max:.6,kind});return m;
}
function battleEvent(e){
 if(e.type==='hit'){
  burst(e.target.x,e.target.z,TYPES[e.unit.type].color,2);beep(110,.035);
  if(TYPES[e.unit.type].range>3)lineEffect(e.unit,e.target,TYPES[e.unit.type].color,.035,.16);
 }
 if(e.type==='special'){
  const u=e.unit,color=TYPES[u.type].color,kind=e.ability;
  beep(kind==='beam'?480:220,.22);burst(u.x,u.z,color,8);
  if(kind==='beam'||kind==='slash'){
   const end={x:u.x+Math.sin(e.angle)*14,z:u.z+Math.cos(e.angle)*14};lineEffect(u,end,color,kind==='beam'?.24:.12,.48);
   if(kind==='slash')orbEffect(u.x+Math.sin(e.angle)*3,u.z+Math.cos(e.angle)*3,color,.7);
  }else if(kind==='rasengan'){
   for(const side of [-1,1]){const clone=character('naruto',u.team);clone.position.set(u.x+side*1.1,0,u.z-.7);clone.rotation.y=e.angle;scene.add(clone);effects.push({mesh:clone,ttl:.8,max:.8,kind:'clone'});}
   orbEffect(e.target.x,e.target.z,color,.65);
  }else if(kind==='stretch'){
   lineEffect(u,{x:u.x+Math.sin(e.angle)*4.8,z:u.z+Math.cos(e.angle)*4.8},0xe8b584,.18,.35);
   orbEffect(u.x+Math.sin(e.angle)*4.8,u.z+Math.cos(e.angle)*4.8,0xe8b584,.45);
  }else if(kind==='web'){
   lineEffect(u,e.target,color,.045,.7);
   const net=mesh(scene,webGeo,color,e.target.x,1.1,e.target.z,1,1,1);net.material=webMat;net.rotation.y=e.angle;effects.push({mesh:net,ttl:1.1,max:1.1,kind:'net'});
  }else if(kind==='ice'){
   for(let i=0;i<8;i++){const a=i*Math.PI/4;const ice=mesh(scene,crystalGeo,color,e.target.x+Math.cos(a)*1.8,.65,e.target.z+Math.sin(a)*1.8,.25,1.5,.25);effects.push({mesh:ice,ttl:1.1,max:1.1,kind:'crystal'});}
  }else if(kind==='water'||kind==='heal'||kind==='psychic'){
   const center=kind==='psychic'?e.target:u;
   const ring=mesh(scene,waveGeo,color,center.x,.5,center.z,1,1,1);ring.rotation.x=Math.PI/2;effects.push({mesh:ring,ttl:.7,max:.7,kind:'wave'});
   burst(center.x,center.z,color,12);
  }else if(kind==='shadow'){
   const hand=mesh(scene,sphere,0xe0c7bc,e.target.x,.4,e.target.z,.23,.12,.28);
   for(let i=0;i<4;i++)mesh(hand,cylinder,0xe0c7bc,-.6+i*.4,.25,.65,.15,.8,.15);
   effects.push({mesh:hand,ttl:.8,max:.8,kind:'ball'});orbEffect(e.target.x,e.target.z,color,.8);
  }else{
   lineEffect(u,e.target,color,.07,.5);orbEffect(e.target.x,e.target.z,color,kind==='void'?1.2:.6);
  }
  toast(`${TYPES[u.type].name} · ${TYPES[u.type].power}`);
 }
if(e.type==='finish'){updateUI();const won=e.winner==='blue';$('resultTitle').textContent=e.winner===null?'Empate.':`${won?'Azul':'Vermelho'} venceu!`;$('resultText').textContent=`${Math.floor(battle.time)} segundos de caos. `+(mode==='campaign'?(won?'Desafio concluído!':'Reorganize sua formação e tente novamente.'):'Troque os times e experimente outra combinação.');if(mode==='campaign'&&won){progress=Math.max(progress,level+1);try{localStorage.setItem('pixelChaos.progress.v1',progress);}catch{}}$('next').hidden=!(mode==='campaign'&&won&&level<4);$('resultDialog').showModal();}}
$('fight').onclick=()=>{if(!formation.some(f=>f.team==='blue')||!formation.some(f=>f.team==='red')){toast('Posicione pelo menos um lutador em cada time.');return;}acc=0;battle=new Battle(formation,battleEvent);$('fight').hidden=true;$('reset').hidden=false;$('pause').disabled=false;document.body.classList.add('battling');renderRoster();beep(650,.2);updateUI();};$('reset').onclick=stop;$('again').onclick=()=>{$('resultDialog').close();stop();};$('next').onclick=()=>{$('resultDialog').close();stop();level++;loadChallenge();};$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';updateUI();};$('speed').onclick=()=>{speed=speed===1?2:speed===2?.5:1;$('speed').textContent=speed+'×';};$('sound').onclick=()=>{sound=!sound;$('sound').style.color=sound?'#d7ff62':'';$('sound').setAttribute('aria-label',sound?'Desativar som':'Ativar som');beep(600);toast(sound?'Som ativado':'Som desativado');};$('teamBlue').onclick=()=>{team='blue';updateUI();};$('teamRed').onclick=()=>{team='red';updateUI();};$('erase').onclick=()=>{erase=!erase;orbit=false;updateUI();};$('clear').onclick=()=>{if(battle)return;formation=formation.filter(f=>f.team!==team);rebuild();};$('demo').onclick=demo;$('sandbox').onclick=()=>setMode('sandbox');$('campaign').onclick=()=>setMode('campaign');$('camera').onclick=()=>{orbit=!orbit;updateUI();};$('zoomIn').onclick=()=>{distance=Math.max(15,distance-3);cameraUpdate();};$('zoomOut').onclick=()=>{distance=Math.min(48,distance+3);cameraUpdate();};$('quality').onclick=()=>{quality=!quality;renderer.setPixelRatio(quality?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio,1.25));$('qualityText').textContent=quality?'ALTO':'LEVE';};$('help').onclick=()=>$('helpDialog').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
const ray=new T.Raycaster(),pointer=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();const touches=new Map();let start=null,moved=false,pinch=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===1){start={x:e.clientX,y:e.clientY};moved=false;}else{moved=true;const p=[...touches.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
canvas.addEventListener('pointermove',e=>{const old=touches.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){const p=[...touches.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);distance=Math.max(15,Math.min(48,distance+(pinch-d)*.05));pinch=d;cameraUpdate();return;}if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)moved=true;if(moved){azimuth-=dx*.006;elevation=Math.max(.35,Math.min(1.35,elevation+dy*.004));cameraUpdate();}});
canvas.addEventListener('pointerup',e=>{touches.delete(e.pointerId);if(moved||battle||orbit||!start){if(!touches.size)start=null;return;}start=null;pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);if(!ray.ray.intersectPlane(plane,hit))return;if(erase){let idx=-1,dist=1;formation.forEach((f,i)=>{const d=Math.hypot(f.x-hit.x,f.z-hit.z);if(d<dist&&(mode!=='campaign'||f.team==='blue')){dist=d;idx=i;}});if(idx>=0){formation.splice(idx,1);rebuild();}return;}if(Math.abs(hit.x)>11||Math.abs(hit.z)>7){toast('Toque dentro da arena.');return;}if((team==='blue'&&hit.x>-.5)||(team==='red'&&hit.x<.5)){toast(`Posicione no lado ${team==='blue'?'azul (esquerda)':'vermelho (direita)'}.`);return;}if(add(selected,team,hit.x,hit.z)){rebuild();beep(350);}});
canvas.addEventListener('pointercancel',e=>{touches.delete(e.pointerId);start=null;moved=true;});canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(15,Math.min(48,distance+e.deltaY*.02));cameraUpdate();},{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
function animate(t){requestAnimationFrame(animate);const dt=Math.min((t-last)/1000||0,.05);last=t;elapsed+=dt;if(!paused)animationClock+=dt*speed;const animTime=battle?animationClock:elapsed;if(battle&&!paused&&!battle.finished){acc+=dt*speed;let steps=0;while(acc>=1/60&&steps++<8){battle.step(1/60);acc-=1/60;}if(steps>=8)acc=0;}if(battle){battle.units.forEach((u,i)=>{const v=views[i],d=v.userData;v.position.set(u.x,0,u.z);if(u.angle!==undefined)v.rotation.y=u.angle;if(!u.hp){d.deathStart??=animationClock;const deadTime=animationClock-d.deathStart;d.body.rotation.z=Math.min(Math.PI/2,deadTime*5);d.body.position.y=-Math.min(.15,deadTime*.2);v.visible=deadTime<6;d.bar.visible=d.barBack.visible=false;return;}d.body.position.y=Math.sin(animTime*9+i)*.025;d.body.rotation.x=u.attack>0?-.16:0;d.legs.forEach((l,j)=>l.rotation.x=u.moving?Math.sin(animTime*10+i+j*Math.PI)*.43:0);d.knees.forEach((k,j)=>k.rotation.x=u.moving?Math.max(0,Math.sin(animTime*10+i+j*Math.PI))*.5:0);d.arms.forEach((a,j)=>a.rotation.x=u.attack>0?-(j===1?1.4:.8):u.moving?Math.sin(animTime*10+i+j*Math.PI)*.3:-.08);d.forearms.forEach((a,j)=>a.rotation.x=u.attack>0?-.5:-.12);d.head.rotation.y=Math.sin(animTime*1.5+i)*.025;d.bar.scale.x=.68*u.hp/u.maxHp;d.bar.position.x=-(.68-d.bar.scale.x)/2;d.ring.material.color.set(u.hit>0?0xffffff:u.team==='blue'?0x68d2ff:0xff7976);});}else views.forEach((v,i)=>{v.userData.body.position.y=Math.sin(elapsed*2+i)*.018;});for(let i=effects.length-1;i>=0;i--){const e=effects[i];if(!paused)e.ttl-=dt*speed;if(e.ttl<=0){scene.remove(e.mesh);if(e.kind==='clone'){disposeCharacter(e.mesh);}effects.splice(i,1);continue;}if(paused)continue;if(e.kind==='particle'){e.mesh.position.x+=e.vx*dt;e.mesh.position.y+=e.vy*dt;e.mesh.position.z+=e.vz*dt;e.vy-=12*dt;e.mesh.scale.setScalar(.12*e.ttl/e.max);}else if(e.kind==='beam'){e.mesh.scale.x*=.97;e.mesh.scale.z*=.97;}else if(e.kind==='wave'){e.mesh.scale.setScalar(1+(1-e.ttl/e.max)*4);}else if(e.kind==='ball'){e.mesh.rotation.y+=dt*3;}}if(Math.floor(elapsed*5)!==Math.floor((elapsed-dt)*5))updateUI();renderer.render(scene,camera);}try{formation=validFormation(JSON.parse(localStorage.getItem('pixelChaos.formation.v1')||'[]'));}catch{}if(!formation.length)demo();else rebuild();requestAnimationFrame(animate);
window.__PIXEL_CHAOS__={get formation(){return formation;},get battle(){return battle;},get mode(){return mode;},renderer};
// Inspection uses the same rounded model, not a separate illustration.
const descriptions={beam:'Rajada que atravessa inimigos em linha.',rasengan:'Rasengan com dano de área e clones visuais temporários.',stretch:'Soco elástico de grande alcance que empurra os inimigos.',void:'Explosão de energia roxa, lentidão e proteção temporária.',slash:'Onda cortante que atravessa a linha inimiga.',water:'Corte circular de água e breve redução de dano.',force:'Dano concentrado que imobiliza o alvo por 1,6 segundos.',heal:'Cura aliados próximos e afasta inimigos com a Força.',web:'Teias que imobilizam e deixam o grupo mais lento.',ice:'Explosão de gelo que causa dano e lentidão em área.',psychic:'Onda telecinética que arremessa e interrompe inimigos.',shadow:'Mãozinha ataca o alvo; Wandinha ganha proteção temporária.'};
let inspectRenderer,inspectScene,inspectCamera,inspectModel,inspectAngle=0;
function drawInspection(){if(!inspectRenderer||!inspectModel)return;inspectModel.rotation.y=inspectAngle;inspectRenderer.render(inspectScene,inspectCamera);}
$('inspect').onclick=()=>{
 if(battle)return;
 if(!inspectRenderer){inspectRenderer=new T.WebGLRenderer({canvas:$('modelCanvas'),alpha:true,antialias:true});inspectRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));inspectRenderer.outputColorSpace=T.SRGBColorSpace;inspectScene=new T.Scene();inspectScene.add(new T.HemisphereLight(0xe2f6ff,0x45404c,2.5));const light=new T.DirectionalLight(0xffe4cb,3);light.position.set(-3,6,4);inspectScene.add(light);inspectCamera=new T.PerspectiveCamera(36,1,.1,30);}
 if(inspectModel){inspectScene.remove(inspectModel);disposeCharacter(inspectModel);}
 inspectModel=character(selected,'blue');inspectModel.userData.bar.visible=inspectModel.userData.barBack.visible=false;inspectScene.add(inspectModel);inspectAngle=.25;
 const d=TYPES[selected];$('inspectName').textContent=d.name;$('inspectDescription').textContent=`${d.series} · ${d.power}. ${descriptions[d.ability]}`;$('inspectStats').textContent=`${d.hp} PV · ${d.damage} ATQ · ${d.cost} moedas`;
 $('inspectDialog').showModal();const rect=$('modelCanvas').getBoundingClientRect();inspectRenderer.setSize(rect.width,rect.height,false);inspectCamera.aspect=rect.width/rect.height;inspectCamera.position.set(0,1.7,5.6);inspectCamera.lookAt(0,1.4,0);inspectCamera.updateProjectionMatrix();drawInspection();
};
$('rotateModel').onclick=()=>{inspectAngle+=Math.PI/4;drawInspection();};
let inspectDrag=null;$('modelCanvas').onpointerdown=e=>{inspectDrag=e.clientX;$('modelCanvas').setPointerCapture(e.pointerId);};$('modelCanvas').onpointermove=e=>{if(inspectDrag===null)return;inspectAngle+=(e.clientX-inspectDrag)*.02;inspectDrag=e.clientX;drawInspection();};$('modelCanvas').onpointerup=$('modelCanvas').onpointercancel=()=>inspectDrag=null;
