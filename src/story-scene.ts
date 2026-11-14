import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { box, makePart, roverFrame } from './rover-art';
import { missionSite, type PartId, type StorySave } from './mission';

const rust=new THREE.MeshStandardMaterial({color:0x9e5035,roughness:1,flatShading:true});
const rock=new THREE.MeshStandardMaterial({color:0x783f31,roughness:1,flatShading:true});
const white=new THREE.MeshStandardMaterial({color:0xe9dbc1,roughness:.65});
const suitDark=new THREE.MeshStandardMaterial({color:0x302523,roughness:.77});
const amber=new THREE.MeshStandardMaterial({color:0xd78b37,metalness:.4,roughness:.29});
const marker=new THREE.MeshBasicMaterial({color:0xf6d96e,side:THREE.DoubleSide});
const cyan=new THREE.MeshBasicMaterial({color:0x8eeded,side:THREE.DoubleSide});
const mountColor=new THREE.MeshBasicMaterial({color:0xf6d96e,transparent:true,opacity:.42,wireframe:true});
function height(x:number,z:number) {
  const radius=Math.hypot(x-19,z+19);
  const crater=-1.7*Math.exp(-((radius/7)**2))+.68*Math.exp(-(((radius-9)/2.4)**2));
  return crater+.23*Math.sin(x*.23)*Math.cos(z*.26)+.11*Math.sin((x+z)*.33);
}
const onGround=(object:THREE.Object3D,x:number,z:number)=>object.position.set(x,height(x,z),z);
type SceneState = { save:StorySave; selection:PartId|null; angle:number; cutscene:boolean };
type SceneActions = { frame:(seconds:number)=>void; pick:(id:PartId)=>void; mount:(id:string)=>void };
const partId = (o:THREE.Object3D) => o.userData.part as PartId|undefined;

export function createStoryScene(host:HTMLElement, actions:SceneActions) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.domElement.setAttribute('aria-label','3D mission scene');
  host.prepend(renderer.domElement);
  const world=new THREE.Scene();
  world.background=new THREE.Color(0x784536);
  world.fog=new THREE.Fog(0x784536,45,112);
  const field=new THREE.Group(), bench=new THREE.Group();
  world.add(field,bench);
  const ambient=new THREE.HemisphereLight(0xffedcb,0x6d382a,2);
  const sun=new THREE.DirectionalLight(0xffe4bd,2.6);
  sun.position.set(-7,13,4);
  world.add(ambient,sun);
  const camera=new THREE.PerspectiveCamera(45,1,.1,165);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;
  controls.enableDamping=true;
  controls.maxPolarAngle=Math.PI*.48;
  controls.minPolarAngle=.2;
  const surface=new THREE.PlaneGeometry(84,84,70,70);
  surface.rotateX(-Math.PI/2);
  const verts=surface.getAttribute('position');
  for(let i=0;i<verts.count;i++) verts.setY(i,height(verts.getX(i),verts.getZ(i)));
  surface.computeVertexNormals();
  field.add(new THREE.Mesh(surface,rust));
  const boundary=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
    [-18,-18],[-18,18],[18,18],[18,-18],
  ].map(([x,z])=>new THREE.Vector3(x,.38,z))),new THREE.LineBasicMaterial({color:0xd99462}));
  field.add(boundary);
  const boulderGeometry=new THREE.DodecahedronGeometry(1,0);
  for(let i=0;i<95;i++){
    const x=37*Math.sin(i*237.1),z=37*Math.cos(i*719.13);
    if(Math.abs(x)<19&&Math.abs(z)<19&&(i%2===0||Math.hypot(x-10,z+10)<7))continue;
    const boulder=new THREE.Mesh(boulderGeometry,rock);
    const size=.17+(i%9)*.12+(Math.abs(x)>20||Math.abs(z)>20?(i%7)*.65:0);
    boulder.scale.set(size*1.2,size*.55,size);
    boulder.rotation.set(i, i*.77,0);
    onGround(boulder,x,z);
    field.add(boulder);
  }
  const [spires,tracks]=missionSite.landmarks;
  for(const [dx,h] of [[-1,4.2],[.9,2.9]]){
    const spire=new THREE.Mesh(new THREE.ConeGeometry(1.12,h,5),rock);
    spire.position.set(spires.position[0]+dx,h*.44,spires.position[1]);
    spire.rotation.z=.1;
    field.add(spire);
  }
  for(let i=0;i<14;i++){
    const x=tracks.position[0]+Math.sin(i*.22)*1.25,z=tracks.position[1]+1-i*.48;
    for(const dx of [-.55,.55]){
      const track=box(.31,.014,.12,rock,x+dx,height(x+dx,z)+.025,z);
      track.rotation.y=-i*.04;
      field.add(track);
    }
  }
  const shelter=new THREE.Group();
  shelter.add(box(2,.85,1.8,suitDark,0,.5),box(2.25,.16,1.96,white,0,1),box(.55,.64,.1,amber,0,.45,-.93));
  onGround(shelter,missionSite.start[0]-2.1,missionSite.start[1]+1.4);
  field.add(shelter);

  const astra=new THREE.Group();
  astra.add(box(.51,.57,.32,white,0,.89),box(.38,.49,.21,suitDark,0,.89,.24));
  const helmet=new THREE.Mesh(new THREE.IcosahedronGeometry(.246,1),white);
  helmet.position.y=1.35;
  astra.add(helmet,box(.33,.155,.13,amber,0,1.355,-.196));
  const limbs:THREE.Mesh[]=[];
  for(const side of [-1,1]){
    astra.add(box(.145,.42,.18,white,side*.345,.88));
    const boot=box(.19,.48,.22,suitDark,side*.132,.34);
    limbs.push(boot);
    astra.add(boot);
  }
  field.add(astra);
  const wreck=roverFrame(false);
  onGround(wreck,...missionSite.wreck);
  wreck.rotation.set(.06,-.49,-.12);
  field.add(wreck);
  const fieldParts = missionSite.parts.map(part=>{
    const object=makePart(part.id);
    const disk=new THREE.Mesh(new THREE.RingGeometry(.63,.7,24),cyan);
    disk.rotation.x=-Math.PI/2;
    disk.position.y=.035;
    const group=new THREE.Group();
    group.add(object,disk);
    object.position.y=.28;
    onGround(group,part.position[0],part.position[1]);
    field.add(group);
    return {part,group,object};
  });
  const pulse=new THREE.Mesh(new THREE.RingGeometry(.9,1,48),cyan.clone());
  pulse.rotation.x=-Math.PI/2;
  pulse.material.transparent=true;
  field.add(pulse);
  let pulseAt=-10, pickupAt=-10, picked:PartId|null=null, placed:PartId|null=null, fitAt=-10, completeAt=-10;
  const baseFrame=roverFrame(false);
  const plinth=box(7,.19,4.6,suitDark,0,-.14);
  const grid=new THREE.GridHelper(7,14,0x866047,0x514539);
  grid.position.y=-.033;
  bench.add(plinth,grid,baseFrame);
  const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(0,.015,-1.55),.69,0xf6d96e,.27,.28);
  bench.add(arrow);
  const exploded:Record<PartId,THREE.Vector3>={
    camera:new THREE.Vector3(-2.3,1.15,-.45),
    solar:new THREE.Vector3(-2.25,.5,1.1),
    wheel:new THREE.Vector3(2.42,.56,.52),
  };
  const components=missionSite.parts.map(part=>{
    const object=makePart(part.id);
    object.userData.part=part.id;
    const mount=new THREE.Mesh(new THREE.BoxGeometry(part.id==='solar'?1.7:.39,.28,part.id==='solar'?.65:.4),mountColor);
    mount.position.set(part.contact[0],part.contact[1],part.contact[2]);
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
  const target=new THREE.Vector3();
  const nextPos=new THREE.Vector3();
  function resetView(next:string) {
    if(next==='bench'){
      controls.minDistance=2.7;controls.maxDistance=13;
      controls.target.set(0,.58,0);camera.position.set(5.7,4.2,6.5);
    }else if(next==='preview'){
      controls.minDistance=10;controls.maxDistance=77;
      controls.target.set(0,0,0);camera.position.set(19,34,27);
    }else if(next==='cutscene'){
      controls.minDistance=3;controls.maxDistance=18;
      controls.target.set(missionSite.wreck[0],.75,missionSite.wreck[1]);
      camera.position.copy(controls.target).add(new THREE.Vector3(5,3.2,5));
    }else{
      controls.minDistance=4;controls.maxDistance=39;
      controls.target.copy(astra.position).add(new THREE.Vector3(0,.72,0));
      camera.position.copy(controls.target).add(new THREE.Vector3(2.6,10,11));
    }
    controls.update();
  }
  function update(next:SceneState){state=next;}
  function render(now:number) {
    const seconds=previous?Math.min(.05,(now-previous)/1000):0;
    previous=now;
    actions.frame(seconds);
    if(state){
      const {save,selection,angle,cutscene}=state;
      const nextMode=cutscene?'cutscene':save.phase==='briefing'?'preview':save.phase==='assemble'||save.phase==='complete'?'bench':'field';
      const moved=Math.hypot(save.x-priorX,save.z-priorZ);
      if(moved>.003)astra.rotation.y=Math.atan2(priorX-save.x,priorZ-save.z);
      for(let i=0;i<limbs.length;i++)limbs[i].rotation.x=moved>.003&&!reduced.matches?Math.sin(now*.014+i*Math.PI)*.42:0;
      priorX=save.x;priorZ=save.z;
      onGround(astra,save.x,save.z);
      if(mode!==nextMode){mode=nextMode;resetView(mode);}
      field.visible=mode!=='bench';
      bench.visible=mode==='bench';
      wreck.visible=cutscene||save.phase==='recover';
      if(mode==='field'){
        target.copy(astra.position).add(new THREE.Vector3(0,.72,0));
        camera.position.add(nextPos.copy(target).sub(controls.target));
        controls.target.copy(target);
      }
      for(const entry of fieldParts){
        const picking=entry.part.id===picked&&now-pickupAt<500&&!reduced.matches;
        entry.group.visible=save.phase==='recover'&&(!save.collected.includes(entry.part.id)||picking);
        entry.object.position.y=picking?.28+(now-pickupAt)/420:.28;
        entry.object.rotation.y=reduced.matches?0:now*.0007;
        entry.object.scale.setScalar(picking?Math.max(.08,1-(now-pickupAt)/520):1);
      }
      const pulseAge=(now-pulseAt)/750;
      pulse.visible=pulseAge<1&&mode==='field'&&!reduced.matches;
      if(pulse.visible){
        pulse.position.set(save.x,astra.position.y+.07,save.z);
        pulse.scale.setScalar(1+pulseAge*12);
        pulse.material.opacity=1-pulseAge;
      }
      for(const {part,object,mount,beacon} of components){
        const fitted=save.fitted.includes(part.id);
        object.position.copy(dragPoint&&pointerPart===part.id?dragPoint:exploded[part.id]);
        object.rotation.y=(fitted?part.angle:selection===part.id?angle:0)*Math.PI/180;
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
    controls.update();
    renderer.render(world,camera);
    animation=requestAnimationFrame(render);
  }
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);
  observer.observe(host);
  resize();
  animation=requestAnimationFrame(render);

  const ray=new THREE.Raycaster();
  function aim(x:number,y:number){
    const rect=renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);
  }
  function hit(x:number,y:number,mountsOnly=false){
    aim(x,y);
    const targets=components.flatMap(c=>[...(!mountsOnly?[c.object]:[]),...(c.mount.visible?[c.mount]:[])]);
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
  renderer.domElement.addEventListener('pointercancel',()=>{pointerPart=undefined;dragPoint=undefined;});

  return {
    update,
    scan(){pulseAt=performance.now();},
    pickup(id:PartId){picked=id;pickupAt=performance.now();},
    fit(id:PartId){placed=id;fitAt=performance.now();},
    complete(){completeAt=performance.now();},
    adjust(action:string){
      if(action==='reset'){resetView(mode);return;}
      const offset=camera.position.clone().sub(controls.target);
      const orbit=new THREE.Spherical().setFromVector3(offset);
      if(action==='left'||action==='right')orbit.theta+=action==='left'?-.38:.38;
      else orbit.radius=THREE.MathUtils.clamp(orbit.radius*(action==='in'?.8:1.25),controls.minDistance,controls.maxDistance);
      camera.position.copy(offset.setFromSpherical(orbit).add(controls.target));
      controls.update();
    },
    dispose(){
      cancelAnimationFrame(animation);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
    },
  };
}
