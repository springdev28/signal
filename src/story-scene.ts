import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { barrel, metal, rounded, strut } from './geometry';
import { astraMaterial } from './astra-materials';
import { createAstra } from './astra';
import { createTerrain, terrainHeight } from './terrain';
import { paintModel } from './paint';
import { addSurveyLandmarks } from './landmarks';
import { createShip } from './ship';
import { loadFlight, type Fix } from './flight-state';
import type { OpportunityModel } from './hardware';
import { missionSite, type PartId, type StorySave } from './mission';
import { turnToward } from './locomotion';

const marker=new THREE.MeshBasicMaterial({color:0x8de6e8,side:THREE.DoubleSide});
const cyan=new THREE.MeshBasicMaterial({color:0x8eeded,side:THREE.DoubleSide});
const mountColor=new THREE.MeshBasicMaterial({color:0xb2eff1,transparent:true,opacity:.13,depthWrite:false});
const height = (x:number,z:number) => terrainHeight(x,z,'mars');
const onGround=(object:THREE.Object3D,x:number,z:number)=>object.position.set(x,height(x,z),z);
type SceneState = { save:StorySave; selection:PartId|null; angle:number; cutscene:boolean; talkUntil:number; waypoint?:Fix;waypointLabel?:string };
type SceneActions = { frame:(seconds:number)=>void; pick:(id:PartId)=>void; mount:(id:string)=>void };
const partId = (o:THREE.Object3D) => o.userData.part as PartId|undefined;

export function createStoryScene(host:HTMLElement, actions:SceneActions, hardware:OpportunityModel) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  renderer.domElement.setAttribute('aria-label','3D mission scene. WASD or arrows move with the camera. Drag to look. E scans or inspects.');
  renderer.domElement.tabIndex=0;
  host.prepend(renderer.domElement);
  const world=new THREE.Scene();
  const terrain=createTerrain(world,'mars');
  const dust=terrain.fog;
  world.fog=dust;
  const sky=terrain.atmosphere;
  const benchBackground=new THREE.Color(0x090f1c);
  const field=terrain.group, bench=new THREE.Group();
  world.add(bench);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const benchLight=new THREE.DirectionalLight(0xc1e8f2,1.6);
  benchLight.position.set(4,5,-5);
  world.add(benchLight);
  const camera=new THREE.PerspectiveCamera(55,1,.1,500);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;
  controls.enableDamping=true;
  controls.maxPolarAngle=Math.PI*.51;
  controls.minPolarAngle=.2;
  addSurveyLandmarks(field,height);
  const flight=loadFlight();
  if(flight.phase==='surface'){
    const craft=createShip();craft.ship.scale.setScalar(1.5);onGround(craft.ship,flight.x,flight.z);craft.ship.position.y+=.12;
    craft.ship.rotation.y=-flight.heading;craft.hatch.rotation.x=-Math.PI/2;craft.interior.visible=false;
    for(const jet of [...craft.jets,...craft.downJets])jet.visible=false;
    field.add(craft.ship);
  }
  const waypoint=new THREE.Mesh(new THREE.RingGeometry(1.35,1.43,48),new THREE.MeshBasicMaterial({color:0x91e6e7,side:THREE.DoubleSide,transparent:true,opacity:.8}));
  waypoint.rotation.x=-Math.PI/2;field.add(waypoint);
  const astra=createAstra();
  astra.model.rotation.y=0;
  field.add(astra.model);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.65,26),new THREE.MeshBasicMaterial({color:0x1d1411,opacity:.3,transparent:true,depthWrite:false}));
  shadow.scale.set(1.2,.78,1);
  shadow.rotation.x=-Math.PI/2;
  field.add(shadow);
  const wreck=hardware.frame();
  onGround(wreck,...missionSite.wreck);
  wreck.rotation.set(.06,-.49,-.12);
  paintModel(wreck,1.3);
  field.add(wreck);
  const fieldParts = missionSite.parts.map(part=>{
    const object=hardware.part(part.id);
    paintModel(object,1.3);
    const group=new THREE.Group();
    group.add(object);
    const restY=-new THREE.Box3().setFromObject(object).min.y+.04;object.position.y=restY;
    onGround(group,part.position[0],part.position[1]);
    field.add(group);
    return {part,group,object,restY};
  });
  const pulse=new THREE.Mesh(new THREE.RingGeometry(.9,1,48),cyan.clone());
  pulse.rotation.x=-Math.PI/2;
  pulse.material.transparent=true;
  field.add(pulse);
  let pulseAt=-Infinity, pickupAt=-Infinity, picked:PartId|null=null, placed:PartId|null=null, fitAt=-Infinity, completeAt=-Infinity;
  const baseFrame=hardware.frame();
  paintModel(baseFrame,1.3);
  const benchSteel=astraMaterial(0x36464d,'steel',.55,.7),benchTrim=metal(0xa18a65,.55,.65);
  const plinth=rounded([7,.24,4.5],.09,benchSteel,[0,-.16,0]);plinth.receiveShadow=true;
  const grid=new THREE.GridHelper(7,14,0x4d656b,0x364b52);grid.scale.z=4.5/7;
  grid.position.y=-.033;
  (grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.3;
  bench.add(plinth,grid,baseFrame);
  for(const x of [-3.39,3.39])bench.add(rounded([.07,.05,4.28],.014,benchTrim,[x,-.015,0]));
  for(const z of [-2.14,2.14])bench.add(rounded([6.8,.05,.07],.014,benchTrim,[0,-.015,z]));
  for(const x of [-3.13,3.13])for(const z of [-1.9,1.9]){
    const leg=rounded([.16,1.1,.16],.025,benchSteel,[x,-.8,z]);leg.castShadow=true;
    bench.add(leg,barrel(.047,.022,benchTrim,[x,-.022,z]));
  }
  for(const x of [-2.7,-1.8,1.8,2.7])bench.add(rounded([.22,.008,.045],.008,benchTrim,[x,-.029,1.9]));
  const taskLight=new THREE.MeshStandardMaterial({color:0xa4dfed,emissive:0x7ba4cf,emissiveIntensity:1.6});
  bench.add(strut([-3.15,0,-1.95],[-3.15,1.45,-1.95],.045,benchSteel),strut([-3.15,1.45,-1.95],[-2.55,1.7,-1.9],.045,benchSteel),rounded([.66,.07,.18],.025,taskLight,[-2.5,1.68,-1.9]));
  const taskGlow=new THREE.PointLight(0x90d4e9,1.5,6,2);taskGlow.position.set(-2.5,1.55,-1.65);bench.add(taskGlow);
  const benchAstra=createAstra();
  benchAstra.model.scale.setScalar(.67);
  benchAstra.model.position.set(-2.64,.01,-1.28);
  benchAstra.model.rotation.y=-1.49;
  bench.add(benchAstra.model);
  const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(0,.015,-1.55),.69,0xf6d96e,.27,.28);
  bench.add(arrow);
  const exploded:Record<PartId,THREE.Vector3>={
    camera:new THREE.Vector3(-2.3,1.15,-.45),
    solar:new THREE.Vector3(-2.10,.68,1.12),
    wheel:new THREE.Vector3(2.42,.56,.52),
  };
  const components=missionSite.parts.map(part=>{
    const object=hardware.part(part.id);
    paintModel(object,1.3);
    object.userData.part=part.id;
    const mountSize=part.id==='solar'?[1.06,.11,.48] as const:part.id==='camera'?[.27,.17,.27] as const:[.26,.28,.32] as const;
    const mount=new THREE.Mesh(new THREE.BoxGeometry(...mountSize),mountColor);
    const edge=new THREE.LineSegments(new THREE.EdgesGeometry(mount.geometry),new THREE.LineBasicMaterial({color:0x9ae7eb}));
    mount.add(edge);
    mount.position.set(part.contact[0],part.contact[1],part.id==='solar'?.32:part.contact[2]);
    mount.userData.mount=part.mount;
    const beacon=new THREE.Mesh(new THREE.RingGeometry(.4,.45,24),marker);
    beacon.rotation.x=-Math.PI/2;
    beacon.position.y=-.19;
    object.add(beacon);
    bench.add(object,mount);
    return {part,object,mount,beacon};
  });

  let pointerPart:PartId|undefined;
  let dragPoint:THREE.Vector3|undefined;
  let mode='',state:SceneState|undefined, previous=0, priorX=0,priorZ=0, animation=0;
  let sceneStarted=0, fitViewScale=1;
  const cutOffset=new THREE.Vector3();
  const target=new THREE.Vector3();
  const nextPos=new THREE.Vector3();
  let cameraMove:{from:THREE.Vector3;to:THREE.Vector3;targetFrom:THREE.Vector3;targetTo:THREE.Vector3;start:number}|undefined;
  controls.addEventListener('start',()=>{cameraMove=undefined;});
  function resetView(next:string,animate=false) {
    const from=camera.position.clone(),targetFrom=controls.target.clone();
    if(next==='bench'){
      controls.minDistance=2.6;controls.maxDistance=Math.max(17,fitViewScale*12);
      controls.target.set(0,.8,0);
      camera.position.copy(controls.target).add(new THREE.Vector3(4.4,3.6,-5.2).multiplyScalar(fitViewScale));
    }else if(next==='preview'){
      controls.minDistance=8;controls.maxDistance=73;
      controls.target.copy(astra.model.position).add(new THREE.Vector3(0,1.35,0));
      camera.position.copy(controls.target).add(new THREE.Vector3(-1.2,.85,6.8));
    }else if(next==='cutscene'){
      controls.minDistance=3;controls.maxDistance=18;
      const [x,z]=missionSite.wreck;
      controls.target.set(x,.92,z);
      cutOffset.set(4.3,2.1,-4.8);
      camera.position.copy(controls.target).add(cutOffset);
    }else{
      controls.minDistance=3.5;controls.maxDistance=15;
      controls.target.copy(astra.model.position).add(new THREE.Vector3(0,1.35,0));
      camera.position.copy(controls.target).add(new THREE.Vector3(-1.2,.85,6.8).multiplyScalar(Math.min(fitViewScale,1.18)));
    }
    controls.update();
    if(animate&&!reduced.matches){
      if(next==='bench'){from.copy(camera.position).sub(controls.target).multiplyScalar(1.16).add(controls.target);targetFrom.copy(controls.target);}
      cameraMove={from,to:camera.position.clone(),targetFrom,targetTo:controls.target.clone(),start:performance.now()};
      camera.position.copy(from);controls.target.copy(targetFrom);
    }
  }
  function update(next:SceneState){state=next;}
  function render(now:number) {
    const seconds=previous?Math.min(.05,(now-previous)/1000):0;
    previous=now;
    actions.frame(seconds);
    if(state){
      const {save,selection,angle,cutscene}=state;
      waypoint.visible=Boolean(state.waypoint)&&['recover','search'].includes(save.phase);
      if(state.waypoint){waypoint.position.set(state.waypoint.x,height(state.waypoint.x,state.waypoint.z)+.06,state.waypoint.z);waypoint.scale.setScalar(Math.max(1,state.waypoint.uncertainty/1.4));}
      const nextMode=cutscene?'cutscene':save.phase==='briefing'?'preview':save.phase==='assemble'||save.phase==='complete'?'bench':'field';
      const moved=Math.hypot(save.x-priorX,save.z-priorZ);
      if(mode&&moved>.0001)astra.model.rotation.y=turnToward(astra.model.rotation.y,Math.atan2(priorX-save.x,priorZ-save.z),seconds);
      priorX=save.x;priorZ=save.z;
      onGround(astra.model,save.x,save.z);
      shadow.position.set(save.x,astra.model.position.y+.018,save.z);
      if(mode!==nextMode){const animate=!!mode;mode=nextMode;sceneStarted=now;resetView(mode,animate);}
      if(mode==='cutscene'){
        astra.model.rotation.y=turnToward(astra.model.rotation.y,Math.atan2(save.x-missionSite.wreck[0],save.z-missionSite.wreck[1]),seconds);
        if(!cameraMove&&!reduced.matches&&now-sceneStarted<1100){
          const t=(now-sceneStarted)/1100;
          const easing=1-(1-t)**3;
          camera.position.copy(cutOffset).applyAxisAngle(new THREE.Vector3(0,1,0),(1-easing)*.54)
            .multiplyScalar(1+(1-easing)*.28).add(controls.target);
        }
      }
      const scanned=(now-pulseAt)/750, collected=(now-pickupAt)/530, fitted=(now-fitAt)/620;
      const poseAmount=(age:number)=>reduced.matches||age<0||age>1?0:Math.sin(age*Math.PI);
      astra.pose(now/1000, mode==='field'?Math.min(1,moved/Math.max(.001,seconds)/6.6):0,
        collected<1?'pickup':scanned<1||cutscene?'scan':now<state.talkUntil?'talk':'idle',
        collected<1?poseAmount(collected):cutscene&&!reduced.matches?.7:poseAmount(scanned));
      benchAstra.pose(now/1000,false,fitted<1?'assemble':now<state.talkUntil?'talk':'idle',poseAmount(fitted));
      field.visible=mode!=='bench';
      sky.visible=field.visible;
      bench.visible=mode==='bench';
      world.background=bench.visible?benchBackground:null;
      world.fog=bench.visible?null:dust;
      wreck.visible=cutscene||save.phase==='recover';
      if(mode==='field'&&!cameraMove){
        target.copy(astra.model.position).add(new THREE.Vector3(0,1.35,0));
        nextPos.copy(controls.target);controls.target.lerp(target,1-Math.exp(-12*seconds));
        camera.position.add(target.copy(controls.target).sub(nextPos));
      }
      for(const entry of fieldParts){
        const picking=entry.part.id===picked&&now-pickupAt<500&&!reduced.matches;
        entry.group.visible=save.phase==='recover'&&(!save.collected.includes(entry.part.id)||picking);
        if(picking){
          const blend=Math.min(1,(now-pickupAt)/500);
          entry.object.position.copy(nextPos.copy(astra.model.position).sub(entry.group.position).multiplyScalar(blend));
          entry.object.position.y+=.28+Math.sin(blend*Math.PI/2)*1.25;
        }else entry.object.position.set(0,entry.restY,0);
        entry.object.rotation.y=picking?(now-pickupAt)*.001:0;
        entry.object.scale.setScalar(picking?Math.max(.08,1-(now-pickupAt)/520):1);
      }
      const pulseAge=(now-pulseAt)/750;
      pulse.visible=pulseAge<1&&mode==='field'&&!reduced.matches;
      if(pulse.visible){
        pulse.position.set(save.x,astra.model.position.y+.07,save.z);
        pulse.scale.setScalar(1+pulseAge*12);
        pulse.material.opacity=1-pulseAge;
      }
      for(const {part,object,mount,beacon} of components){
        const fitted=save.fitted.includes(part.id);
        object.position.copy(dragPoint&&pointerPart===part.id?dragPoint:exploded[part.id]);
        const targetAngle=(fitted?part.angle:selection===part.id?angle:0)*Math.PI/180;
        const angleDelta=Math.atan2(Math.sin(targetAngle-object.rotation.y),Math.cos(targetAngle-object.rotation.y));
        object.rotation.y=reduced.matches?targetAngle:THREE.MathUtils.damp(object.rotation.y,object.rotation.y+angleDelta,14,seconds);
        if(fitted){
          const age=reduced.matches||placed!==part.id?1:Math.min(1,(now-fitAt)/480);
          object.position.lerp(nextPos.set(part.contact[0],part.contact[1],part.contact[2]),1-(1-age)**3);
        }
        beacon.visible=selection===part.id&&!fitted;
        mount.visible=!fitted;
      }
      if(save.phase==='complete'&&!reduced.matches&&now-completeAt<1350){
        const progress=(now-completeAt)/1350;
        bench.rotation.y=(1-(1-progress)**3)*Math.PI*2;
      }else bench.rotation.y=0;
    }
    if(cameraMove){
      const t=Math.min(1,(now-cameraMove.start)/600),ease=t*t*(3-2*t);
      camera.position.lerpVectors(cameraMove.from,cameraMove.to,ease);
      controls.target.lerpVectors(cameraMove.targetFrom,cameraMove.targetTo,ease);
      if(t===1)cameraMove=undefined;
    }
    controls.update();
    host.dataset.cameraHeading=controls.getAzimuthalAngle().toFixed(4);
    host.dataset.facing=astra.model.rotation.y.toFixed(4);host.dataset.cameraPosition=camera.position.toArray().map(n=>n.toFixed(2)).join(',');host.dataset.cameraTarget=controls.target.toArray().map(n=>n.toFixed(2)).join(',');
    if(state)host.dataset.position=state.save.x.toFixed(2)+','+state.save.z.toFixed(2);
    const hud=host.querySelector<HTMLElement>('#surface-waypoint-hud');
    if(hud){
      hud.hidden=!state?.waypoint||mode==='bench'||mode==='cutscene';
      if(!hud.hidden&&state?.waypoint){
        const fix=state.waypoint,point=new THREE.Vector3(fix.x,height(fix.x,fix.z)+1.9,fix.z).project(camera);
        const behind=point.z>1;
        const x=THREE.MathUtils.clamp((point.x*.5+.5)*host.clientWidth,80,host.clientWidth-80);
        const y=THREE.MathUtils.clamp((.5-point.y*.5)*host.clientHeight,150,host.clientHeight-230);
        hud.style.left=(behind?host.clientWidth-80:x)+'px';hud.style.top=(behind?host.clientHeight*.42:y)+'px';
        hud.textContent=(behind?'Turn around · ':'')+(state.waypointLabel??'Locked waypoint');
        const range=document.createElement('span');range.textContent=Math.hypot(fix.x-state.save.x,fix.z-state.save.z).toFixed(0)+' m';hud.append(range);
      }
    }
    if(mode==='field')camera.position.y=Math.max(camera.position.y,height(camera.position.x,camera.position.z)+.45);
    renderer.render(world,camera);
    animation=requestAnimationFrame(render);
  }
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);
    const old=fitViewScale;
    camera.aspect=w/h;
    if(document.querySelector('#detail-drawer[open]')){if(w<=620)camera.setViewOffset(w,h,0,h*.23,w,h);else camera.setViewOffset(w,h,190,0,w,h);}
    else camera.clearViewOffset();
    fitViewScale=Math.max(1,1.1/camera.aspect);
    if(mode==='bench'||mode==='preview'){
      camera.position.sub(controls.target).multiplyScalar(fitViewScale/old).add(controls.target);
      controls.update();
    }
    camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);
  observer.observe(host);
  const drawer=document.querySelector('#detail-drawer');
  if(drawer)new MutationObserver(resize).observe(drawer,{attributes:true,attributeFilter:['open']});
  resize();
  animation=requestAnimationFrame(render);

  const ray=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  function aim(x:number,y:number){
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);
    ray.setFromCamera(pointer,camera);
  }
  function hit(x:number,y:number,mountsOnly=false){
    aim(x,y);
    const targets=components.flatMap(c=>[...(!mountsOnly&&c.mount.visible?[c.object]:[]),...(c.mount.visible?[c.mount]:[])]);
    if(mountsOnly){
      const projected=new THREE.Vector3();
      let nearest:THREE.Mesh|undefined;
      let range=24;
      const area=renderer.domElement.getBoundingClientRect();
      for(const {mount} of components){
        if(!mount.visible)continue;
        projected.copy(mount.position).project(camera);
        const delta=Math.hypot((projected.x-pointer.x)*area.width/2,(projected.y-pointer.y)*area.height/2);
        if(delta<range){range=delta;nearest=mount;}
      }
      if(nearest)return nearest;
    }
    for(const result of ray.intersectObjects(targets,true)){
      let hit:THREE.Object3D|null=result.object;
      while(hit&&!partId(hit)&&!hit.userData.mount)hit=hit.parent;
      if(hit)return hit;
    }
  }
  const dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.15);
  function pointerDown(event:PointerEvent){
    if(state?.save.phase!=='assemble'||!event.isPrimary)return;
    const target=hit(event.clientX,event.clientY);
    if(!target)return;
    event.stopImmediatePropagation();
    renderer.domElement.setPointerCapture(event.pointerId);
    pointerPart=partId(target);
    if(pointerPart)actions.pick(pointerPart);
    else if(target.userData.mount)actions.mount(target.userData.mount);
  }
  function pointerMove(event:PointerEvent){
    if(!pointerPart)return;
    aim(event.clientX,event.clientY);
    dragPoint=ray.ray.intersectPlane(dragPlane,new THREE.Vector3())??undefined;
  }
  function pointerUp(event:PointerEvent){
    if(!pointerPart)return;
    const target=dragPoint?hit(event.clientX,event.clientY,true):undefined;
    pointerPart=undefined;dragPoint=undefined;
    if(target?.userData.mount)actions.mount(target.userData.mount);
  }
  renderer.domElement.addEventListener('pointerdown',pointerDown,true);
  renderer.domElement.addEventListener('pointermove',pointerMove);
  renderer.domElement.addEventListener('pointerup',pointerUp);
  function cancelDrag(){pointerPart=undefined;dragPoint=undefined;}
  renderer.domElement.addEventListener('pointercancel',cancelDrag);
  renderer.domElement.addEventListener('lostpointercapture',cancelDrag);

  return {
    update,
    movementHeading(){return controls.getAzimuthalAngle();},
    scan(){pulseAt=performance.now();},
    pickup(id:PartId){picked=id;pickupAt=performance.now();},
    fit(id:PartId){placed=id;fitAt=performance.now();},
    complete(){completeAt=performance.now();},
    adjust(action:string){
      if(action==='reset'){resetView(mode,true);return;}
      const from=camera.position.clone();
      const offset=camera.position.clone().sub(controls.target);
      const orbit=new THREE.Spherical().setFromVector3(offset);
      if(action==='left'||action==='right')orbit.theta+=action==='left'?-.38:.38;
      else orbit.radius=THREE.MathUtils.clamp(orbit.radius*(action==='in'?.8:1.25),controls.minDistance,controls.maxDistance);
      camera.position.copy(offset.setFromSpherical(orbit).add(controls.target));
      controls.update();
      if(!reduced.matches){cameraMove={from,to:camera.position.clone(),targetFrom:controls.target.clone(),targetTo:controls.target.clone(),start:performance.now()};camera.position.copy(from);}
    },
    dispose(){
      cancelAnimationFrame(animation);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
    },
  };
}
