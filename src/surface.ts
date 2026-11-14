import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createAstra } from './astra';
import { createTerrain } from './terrain';
import { createLunarRover } from './lunar-model';
import { loadOpportunity } from './hardware';
import { paintModel } from './paint';
import { asset, destinations, link, sources, type WorldId } from './catalog';
import { icon, sourceLink } from './ui';
import type { SolarisContext } from './solaris';
import { createGroundMotion, movementKeys, relativeMovement, turnToward, type GroundDirection } from './locomotion';

const sites = {
  moon: [
    { id: 'rover', name: 'Lunar Roving Vehicle', x: -11, z: -18, note: 'Two seats, a folding frame, and wire mesh wheels. Inspect the hardware the Apollo 15 crew used on their traverses.' },
    { id: 'rille', name: 'Rille overlook', x: -26, z: -10, note: 'The Apollo 15 crew explored the Hadley–Apennine region near Hadley Rille. Follow the landing-site record for the real traverse.' },
    { id: 'ridge', name: 'Highland ridge', x: 16, z: -22, note: 'Bright highlands and darker basalt plains record different chapters of the Moon’s surface history.' },
  ],
  mars: [
    { id: 'rover', name: 'Opportunity', x: 10, z: -10, note: 'Six wheels carry the solar deck and camera mast. Inspect the instruments, or locate the signal in Odyssey to reconstruct a rover.' },
    { id: 'outcrop', name: 'Crater outcrop', x: -18, z: -13, note: 'Rock outcrops at Eagle Crater helped Opportunity establish that water persisted on ancient Mars.' },
    { id: 'ridge', name: 'Ridge overlook', x: 17, z: 17, note: 'Wind and dust affect a solar-powered rover’s energy. Open the dust activity in Opportunity’s exhibit to experiment.' },
  ],
};

export function surfaceMarkup(world: WorldId) {
  const lunar = world === 'moon';
  return `<section class="surface-interface" aria-label="${destinations[world].name} surface exploration">
    <div id="surface-stage" class="simulation-canvas"><p class="view-state" role="status">Deploying Astra…</p></div>
    <header class="surface-heading"><a class="back-link" href="${link(world)}">${icon('up',15)} Return to orbit</a>
      <p class="eyebrow">${destinations[world].name} · Free exploration</p><h1>${lunar ? 'Hadley–Apennine' : 'Meridiani Planum'}</h1>
      <p>Reconstructed terrain · walk to a landmark and scan</p></header>
    <details class="surface-map hud-panel"><summary>Map &amp; waypoints</summary>
      <div class="surface-map-view" role="img" aria-label="Astra and nearby landmarks">${sites[world].map(site=>`<span class="surface-map-site" style="left:${50+site.x*.95}%;top:${50+site.z*.95}%" title="${site.name}">${icon(site.id==='rover'?'box':'pin',16)}</span>`).join('')}<span id="surface-player" aria-label="Astra">◆</span><span class="map-north">N ↑</span></div>
      <p id="surface-coordinates" class="coordinates">0 m E · 0 m N</p><p id="surface-bearing">Choose a landmark to set a waypoint.</p>
      <div class="surface-locations"><label for="surface-waypoint">Waypoint</label><select id="surface-waypoint"><option value="">Choose a landmark</option>${sites[world].map(site=>`<option value="${site.id}">${site.name}</option>`).join('')}</select></div>
    </details>
    <div class="surface-reticle" aria-hidden="true">+</div>
    <section class="surface-find hud-panel" id="surface-find" hidden><button class="close" id="close-surface-find" aria-label="Close observation">×</button><h2 id="surface-find-title"></h2><p id="surface-find-copy"></p>
      <div id="surface-find-action"></div>${sourceLink(lunar?sources.lunarRover:sources.mer,lunar?'NASA Lunar Roving Vehicles':'NASA Spirit & Opportunity')}</section>
    <div class="surface-controls"><div class="movement-cluster"><p class="keyboard-hint"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><small>Move with the camera</small></p><div class="direction-pad" aria-label="Move Astra">${[['forward','up'],['left','back'],['backward','lower'],['right','arrow']].map(([dir,glyph])=>`<button class="icon-button" data-walk="${dir}" aria-label="Move ${dir}">${icon(glyph as 'up',18)}</button>`).join('')}</div></div>
      <div class="surface-actions hud-panel"><p id="surface-status" role="status">Follow the landscape. Look for the rover.</p><div><button class="button primary" id="surface-scan">${icon('scan',18)} Scan</button><button class="button" id="surface-jump">Jump</button><button class="icon-button" id="surface-reset" aria-label="Reset camera">${icon('reset',18)}</button></div></div>
    </div>
    <p class="surface-help">Drag to look · Tap terrain to walk <span>· Space jump · E scan</span></p>
  </section>`;
}

export async function mountSurface(world: WorldId, context: SolarisContext) {
  const host = document.querySelector<HTMLElement>('#surface-stage')!;
  const $ = (id: string) => document.getElementById(id)!;
  context.subject = `${destinations[world].name} · Surface exploration`;
  const keys = new Set<GroundDirection>();
  const pointerKeys = new Map<number,GroundDirection>();
  const motion=createGroundMotion(3.5);
  const state = { x: 0, z: 5, found: [] as string[] };
  try {
    const value = JSON.parse(localStorage.getItem('signal-surface-'+world) ?? 'null');
    if(value && Number.isFinite(value.x) && Number.isFinite(value.z)){
      state.x=THREE.MathUtils.clamp(value.x,-42,42);state.z=THREE.MathUtils.clamp(value.z,-42,42);
      state.found=Array.isArray(value.found)?value.found.filter((id:string)=>sites[world].some(site=>site.id===id)):[];
    }
  } catch { /* A new exploration can start without saved progress. */ }
  let waypoint: typeof sites[WorldId][number] | undefined, destination:THREE.Vector3|undefined;
  let altitude=0, verticalSpeed=0, last=0, lastSave=0, animation=0, start=performance.now(), scanAt=-Infinity;
  const save = () => {try{localStorage.setItem('signal-surface-'+world,JSON.stringify(state));}catch{/* Exploration works without device storage. */}};
  let renderer:THREE.WebGLRenderer;
  try {renderer=new THREE.WebGLRenderer({antialias:true});}catch{
    host.innerHTML=`<img class="surface-fallback" src="${asset(world+'-illustration.jpg')}" alt="${destinations[world].name}"><p class="view-state">3D exploration needs WebGL. <a href="${link(world)}">Return to the atlas</a></p>`;
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  const terrain=createTerrain(scene,world);scene.fog=terrain.fog;
  const astra=createAstra();astra.model.rotation.y=Math.PI+.35;scene.add(astra.model);
  const camera=new THREE.PerspectiveCamera(48,1,.1,500);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=35;controls.maxPolarAngle=Math.PI*.48;
  let cameraReset:{from:THREE.Vector3;to:THREE.Vector3;start:number}|undefined;
  function resetCamera(animate=false){
    const target=new THREE.Vector3(state.x,terrain.height(state.x,state.z)+1.6,state.z);
    const to=target.clone().add(new THREE.Vector3(3.8,1.6,8));
    if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)cameraReset={from:camera.position.clone(),to,start:performance.now()};
    else {controls.target.copy(target);camera.position.copy(to);controls.update();}
  }
  controls.addEventListener('start',()=>{cameraReset=undefined;arriving=false;});
  const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight,false);};
  new ResizeObserver(resize).observe(host);resize();resetCamera();
  const rover = world==='moon'?createLunarRover():await loadOpportunity().then(model=>model.assembled()).catch(()=>null);
  if(rover){
    paintModel(rover,1.2);const site=sites[world][0];rover.position.set(site.x,terrain.height(site.x,site.z),site.z);rover.rotation.y=.5;scene.add(rover);
  }
  const pinMaterial=new THREE.MeshBasicMaterial({color:0x93e2d7,transparent:true,opacity:.64,depthWrite:false});
  const rings=sites[world].map(site=>{
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.6,1.67,50),pinMaterial);ring.rotation.x=-Math.PI/2;
    ring.position.set(site.x,terrain.height(site.x,site.z)+.08,site.z);scene.add(ring);return ring;
  });
  const pulse=new THREE.Mesh(new THREE.RingGeometry(.9,1,70),pinMaterial.clone());pulse.rotation.x=-Math.PI/2;scene.add(pulse);
  const targetMarker=new THREE.Mesh(new THREE.RingGeometry(.24,.32,24),pinMaterial);targetMarker.rotation.x=-Math.PI/2;scene.add(targetMarker);targetMarker.visible=false;
  function scan(){
    scanAt=performance.now();
    const nearest=[...sites[world]].sort((a,b)=>Math.hypot(a.x-state.x,a.z-state.z)-Math.hypot(b.x-state.x,b.z-state.z))[0];
    const distance=Math.hypot(nearest.x-state.x,nearest.z-state.z);
    if(distance>6){$('surface-status').textContent=`${nearest.name} · ${Math.round(distance)} m away. Move closer to inspect.`;return;}
    if(!state.found.includes(nearest.id))state.found.push(nearest.id);
    context.selection=nearest.id;context.subject=nearest.name;
    $('surface-find-title').textContent=nearest.name;$('surface-find-copy').textContent=nearest.note;
    $('surface-find-action').innerHTML=nearest.id==='rover'?`<a class="button primary" href="${link(world==='moon'?'lunar':'opportunity')}">Inspect hardware ${icon('arrow',16)}</a>`:'';
    $('surface-find').hidden=false;$('surface-status').textContent=`${state.found.length} / 3 landmarks explored`;
    destination=undefined;save();
  }
  $('surface-scan').addEventListener('click',scan);
  $('close-surface-find').addEventListener('click',()=>{$('surface-find').hidden=true;});
  const jump=()=>{if(altitude===0&&!document.querySelector('dialog[open]'))verticalSpeed=3.1;};
  $('surface-jump').addEventListener('click',jump);$('surface-reset').addEventListener('click',()=>{arriving=false;resetCamera(true);});
  document.addEventListener('keydown',event=>{
    if(document.querySelector('dialog[open]')||(event.target as HTMLElement).closest('input,select,textarea'))return;
    const direction=movementKeys[event.key.toLowerCase()];
    if(direction){event.preventDefault();keys.add(direction);destination=undefined;arriving=false;cameraReset=undefined;}
    if(event.code==='Space'&&event.target===document.body){event.preventDefault();if(!event.repeat)jump();}
    if(event.key.toLowerCase()==='e'&&!event.repeat)scan();
  });
  document.addEventListener('keyup',e=>{keys.delete(movementKeys[e.key.toLowerCase()]);});
  const stop=()=>{keys.clear();pointerKeys.clear();destination=undefined;motion.stop();};
  window.addEventListener('blur',stop);
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-walk]')){
    button.addEventListener('pointerdown',e=>{button.setPointerCapture(e.pointerId);pointerKeys.set(e.pointerId,button.dataset.walk as GroundDirection);destination=undefined;arriving=false;cameraReset=undefined;e.preventDefault();});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>pointerKeys.delete((e as PointerEvent).pointerId));
    button.addEventListener('click',e=>{
      if(e.detail!==0)return;
      const delta=relativeMovement([button.dataset.walk as GroundDirection],controls.getAzimuthalAngle());
      destination=new THREE.Vector3(THREE.MathUtils.clamp(state.x+delta.x,-42,42),0,THREE.MathUtils.clamp(state.z+delta.z,-42,42));
      destination.y=terrain.height(destination.x,destination.z);arriving=false;
    });
  }
  $('surface-waypoint').addEventListener('change',()=>{
    waypoint=sites[world].find(site=>site.id===($('surface-waypoint') as HTMLSelectElement).value);
    if(waypoint)$('surface-status').textContent='Waypoint set · '+waypoint.name;
    else $('surface-bearing').textContent='Choose a landmark to set a waypoint.';
  });
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let pointerStart=[0,0],pointerCount=0,multiTouch=false;
  renderer.domElement.addEventListener('pointerdown',e=>{if(pointerCount===0){pointerStart=[e.clientX,e.clientY];multiTouch=false;}pointerCount++;if(pointerCount>1)multiTouch=true;});
  renderer.domElement.addEventListener('pointercancel',()=>{pointerCount=0;});
  renderer.domElement.addEventListener('pointerup',e=>{
    pointerCount=Math.max(0,pointerCount-1);
    if(pointerCount||multiTouch||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>7)return;
    const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);ray.setFromCamera(mouse,camera);
    const hit=ray.intersectObject(terrain.ground)[0];if(hit&&Math.abs(hit.point.x)<42&&Math.abs(hit.point.z)<42)destination=hit.point.clone();
  });
  const currentTarget=new THREE.Vector3(),priorTarget=new THREE.Vector3();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let arriving=!reduced;
  function draw(now:number){
    const dt=last?Math.min(.04,(now-last)/1000):0;last=now;
    const paused=!!document.querySelector('dialog[open]');
    if(paused){keys.clear();pointerKeys.clear();motion.stop();}
    const input=relativeMovement([...keys,...pointerKeys.values()],controls.getAzimuthalAngle());
    if(destination){const dx=destination.x-state.x,dz=destination.z-state.z,length=Math.hypot(dx,dz);if(length<.12){destination=undefined;}else{input.x=dx/length*Math.min(1,length/1.0);input.z=dz/length*Math.min(1,length/1.0);}}
    const step=motion.step(paused?0:input.x,paused?0:input.z,dt);
    const walking=step.speed>.03;
    state.x=THREE.MathUtils.clamp(state.x+step.x,-42,42);state.z=THREE.MathUtils.clamp(state.z+step.z,-42,42);
    if(walking)astra.model.rotation.y=turnToward(astra.model.rotation.y,Math.atan2(-step.x,-step.z),dt);
    if(!paused&&(verticalSpeed||altitude)){verticalSpeed-=dt*(world==='moon'?1.62:3.71);altitude=Math.max(0,altitude+verticalSpeed*dt);if(!altitude)verticalSpeed=0;}
    astra.model.position.set(state.x,terrain.height(state.x,state.z)+altitude,state.z);
    const scanAge=(now-scanAt)/1000;
    astra.pose(now/1000,altitude>.1?0:step.fraction,scanAge<1?'scan':'idle',scanAge<1?Math.sin(scanAge*Math.PI):0);
    priorTarget.copy(controls.target);currentTarget.set(state.x,terrain.height(state.x,state.z)+1.6,state.z);
    controls.target.lerp(currentTarget,1-Math.exp(-12*dt));camera.position.add(currentTarget.copy(controls.target).sub(priorTarget));
    if(arriving){const t=Math.max(0,1-(now-start)/1600);camera.position.copy(controls.target).add(new THREE.Vector3(3.8+9*t*t,1.6+28*t*t,8+9*t*t));arriving=t>0;}
    if(cameraReset){const t=Math.min(1,(now-cameraReset.start)/450);camera.position.lerpVectors(cameraReset.from,cameraReset.to,t*t*(3-2*t));if(t===1)cameraReset=undefined;}
    targetMarker.visible=!!destination;if(destination)targetMarker.position.copy(destination).add(new THREE.Vector3(0,.09,0));
    pulse.visible=scanAge<1&&!reduced;pulse.position.set(state.x,terrain.height(state.x,state.z)+.13,state.z);pulse.scale.setScalar(1+scanAge*12);pulse.material.opacity=Math.max(0,1-scanAge);
    rings.forEach((ring,i)=>{ring.material=pinMaterial;ring.visible=waypoint?.id===sites[world][i].id;});
    $('surface-coordinates').textContent=`${Math.abs(state.x).toFixed(0)} m ${state.x<0?'W':'E'} · ${Math.abs(state.z).toFixed(0)} m ${state.z<0?'N':'S'}`;
    $('surface-player').style.left=50+state.x*.95+'%';$('surface-player').style.top=50+state.z*.95+'%';
    if(waypoint)$('surface-bearing').textContent=waypoint.name+' · '+Math.round(Math.hypot(waypoint.x-state.x,waypoint.z-state.z))+' m';
    host.dataset.position=state.x.toFixed(2)+','+state.z.toFixed(2);host.dataset.altitude=altitude.toFixed(2);
    host.dataset.cameraDistance=camera.position.distanceTo(controls.target).toFixed(2);
    host.dataset.cameraHeading=controls.getAzimuthalAngle().toFixed(4);host.dataset.facing=astra.model.rotation.y.toFixed(4);host.dataset.speed=step.speed.toFixed(3);
    controls.update();renderer.render(scene,camera);
    if(now-lastSave>2000){save();lastSave=now;}
    animation=requestAnimationFrame(draw);
  }
  host.querySelector('.view-state')!.remove();host.classList.add('view-ready');draw(performance.now());
  window.addEventListener('pagehide',()=>{save();cancelAnimationFrame(animation);controls.dispose();renderer.dispose();},{once:true});
}
