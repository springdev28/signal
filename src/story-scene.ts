import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { box, barrel, metal, rounded, strut } from './geometry';
import { createAstra } from './astra';
import type { OpportunityModel } from './hardware';
import { missionSite, type PartId, type StorySave } from './mission';

const rock=new THREE.MeshStandardMaterial({color:0x8b5945,roughness:1,flatShading:true});
const white=new THREE.MeshStandardMaterial({color:0xe9dbc1,roughness:.65});
const suitDark=new THREE.MeshStandardMaterial({color:0x302523,roughness:.77});
const amber=new THREE.MeshStandardMaterial({color:0xd78b37,metalness:.4,roughness:.29});
const marker=new THREE.MeshBasicMaterial({color:0x8de6e8,side:THREE.DoubleSide});
const cyan=new THREE.MeshBasicMaterial({color:0x8eeded,side:THREE.DoubleSide});
const mountColor=new THREE.MeshBasicMaterial({color:0xb2eff1,transparent:true,opacity:.13,depthWrite:false});
function height(x:number,z:number) {
  const radius=Math.hypot(x-19,z+19);
  const crater=-1.7*Math.exp(-((radius/7)**2))+.68*Math.exp(-(((radius-9)/2.4)**2));
  const fold = .37*Math.sin(x*.21+z*.08)*Math.cos(z*.16) + .15*Math.sin((x+z)*.51);
  const ridge = Math.max(0, (Math.hypot(x,z)-23)/7)
    * (.9+.78*Math.sin(z*.23)+.31*Math.cos(x*.42+z*.31));
  return crater+fold+ridge;
}
const onGround=(object:THREE.Object3D,x:number,z:number)=>object.position.set(x,height(x,z),z);
type SceneState = { save:StorySave; selection:PartId|null; angle:number; cutscene:boolean };
type SceneActions = { frame:(seconds:number)=>void; pick:(id:PartId)=>void; mount:(id:string)=>void };
const partId = (o:THREE.Object3D) => o.userData.part as PartId|undefined;

export function createStoryScene(host:HTMLElement, actions:SceneActions, hardware:OpportunityModel) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.22;
  renderer.domElement.setAttribute('aria-label','3D mission scene');
  host.prepend(renderer.domElement);
  const world=new THREE.Scene();
  const dust=new THREE.FogExp2(0xa16d58,.020);
  world.fog=dust;
  const sky=new THREE.Mesh(new THREE.SphereGeometry(119,20,12),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    vertexShader:`varying vec3 vPosition;
      void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vPosition;
      void main(){
        vec3 d=normalize(vPosition);
        vec3 low=vec3(.45,.25,.18), high=vec3(.09,.125,.16);
        vec3 sky=mix(low,high,smoothstep(-.025,.64,d.y));
        float glow=pow(max(0.,dot(d,normalize(vec3(-.74,.12,-.66)))),8.);
        gl_FragColor=vec4(sky+glow*vec3(.21,.115,.063),1.);
        #include <colorspace_fragment>
      }`,
  }));
  world.add(sky);
  const benchBackground=new THREE.Color(0x0b131a);
  const field=new THREE.Group(), bench=new THREE.Group();
  world.add(field,bench);
  const ambient=new THREE.HemisphereLight(0xdae5ea,0x7c5546,1.1);
  const sun=new THREE.DirectionalLight(0xffd8aa,2.9);
  sun.position.set(-13,9,-9);
  const fill=new THREE.DirectionalLight(0x93c5d9,1.65);
  fill.position.set(6,5,8);
  world.add(ambient,sun,fill);
  const camera=new THREE.PerspectiveCamera(45,1,.1,165);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;
  controls.enableDamping=true;
  controls.maxPolarAngle=Math.PI*.49;
  controls.minPolarAngle=.2;
  const surface=new THREE.PlaneGeometry(142,142,160,160);
  surface.rotateX(-Math.PI/2);
  const verts=surface.getAttribute('position');
  const colors:number[]=[];
  const lightDust=new THREE.Color(0xaf755b), rockDust=new THREE.Color(0x704538);
  for(let i=0;i<verts.count;i++) {
    const x=verts.getX(i),z=verts.getZ(i);
    verts.setY(i,height(x,z));
    const mix=Math.min(1,Math.max(0,.51+.23*Math.sin(x*.6+z*.2)*Math.cos(z*.42)
      +.14*Math.sin(x*3.64+z*2.14)+.1*Math.sin(i*243.51)));
    const color=rockDust.clone().lerp(lightDust,mix);
    colors.push(color.r,color.g,color.b);
  }
  surface.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  surface.computeVertexNormals();
  const grain=document.createElement('canvas');
  grain.width=grain.height=128;
  const brush=grain.getContext('2d')!;
  const noise=brush.createImageData(128,128);
  for(let i=0;i<noise.data.length;i+=4){
    const value=95+(Math.sin(i*253.1)*.5+.5)*65+(Math.sin(i*.037)*.5+.5)*50;
    noise.data[i]=noise.data[i+1]=noise.data[i+2]=value;
    noise.data[i+3]=255;
  }
  brush.putImageData(noise,0,0);
  const surfaceGrain=new THREE.CanvasTexture(grain);
  surfaceGrain.wrapS=surfaceGrain.wrapT=THREE.RepeatWrapping;
  surfaceGrain.repeat.set(83,83);
  field.add(new THREE.Mesh(surface,new THREE.MeshStandardMaterial({
    vertexColors:true,roughness:1,bumpMap:surfaceGrain,bumpScale:.09,
  })));
  const boulderGeometry=new THREE.IcosahedronGeometry(1,1);
  const boulders = new THREE.InstancedMesh(boulderGeometry,rock,230);
  const dummy = new THREE.Object3D();
  let stoneCount=0;
  for(let i=0;i<230;i++){
    const x=62*Math.sin(i*237.1),z=62*Math.cos(i*719.13);
    const near=Math.abs(x)<20&&Math.abs(z)<20;
    if(near&&Math.hypot(x-10,z+10)<6)continue;
    const size=near?.13+(i%9)*.078:.62+(i%17)*.31;
    dummy.scale.set(size*(1.4+i%3*.26),size*.43,size*(1+i%5*.12));
    dummy.rotation.set(i,i*.77,0);
    dummy.position.set(x,height(x,z)-size*.09,z);
    dummy.updateMatrix();
    boulders.setMatrixAt(stoneCount,dummy.matrix);
    boulders.setColorAt(stoneCount,new THREE.Color().setHSL(.045+(i%7)*.009,.25+(i%4)*.058,.44+(i%7)*.034));
    stoneCount++;
  }
  boulders.count=stoneCount;
  field.add(boulders);
  const [spires,tracks]=missionSite.landmarks;
  for(const [dx,h] of [[-1,4.2],[.9,2.9]]){
    for(let i=0;i<4;i++){
      const spire=new THREE.Mesh(boulderGeometry,rock);
      const width=(1-i*.185)*(1.1+(dx>0?.1:0));
      spire.scale.set(width,h*.29,width*.89);
      spire.position.set(spires.position[0]+dx+i*.125,height(...spires.position)+h*(.15+i*.2),spires.position[1]+i*.14);
      spire.rotation.set(i*.44,.7+i*.49,-.15);
      field.add(spire);
    }
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
  shelter.add(rounded([2,.83,1.5],.13,suitDark,[0,.49,0]),rounded([2.15,.13,1.62],.045,white,[0,.936,0]),
    rounded([.52,.55,.11],.045,amber,[0,.47,-.77]),barrel(.084,.23,amber,[.7,1.05,.31]),
    strut([.7,.95,.31],[.67,2,.3],.025,white));
  for(const side of [-1,1]) shelter.add(strut([side*.86,.31,-.48],[side*1.12,.04,-.69],.065,suitDark),strut([side*.86,.31,.48],[side*1.12,.04,.69],.065,suitDark));

  onGround(shelter,missionSite.start[0]-2.1,missionSite.start[1]+1.4);
  field.add(shelter);

  const astra=createAstra();
  astra.model.rotation.y=-.32;
  field.add(astra.model);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.65,26),new THREE.MeshBasicMaterial({color:0x1d1411,opacity:.3,transparent:true,depthWrite:false}));
  shadow.scale.set(1.2,.78,1);
  shadow.rotation.x=-Math.PI/2;
  field.add(shadow);
  const wreck=hardware.frame();
  onGround(wreck,...missionSite.wreck);
  wreck.rotation.set(.06,-.49,-.12);
  field.add(wreck);
  const fieldParts = missionSite.parts.map(part=>{
    const object=hardware.part(part.id);
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
  let pulseAt=-Infinity, pickupAt=-Infinity, picked:PartId|null=null, placed:PartId|null=null, fitAt=-Infinity, completeAt=-Infinity;
  const baseFrame=hardware.frame();
  const plinth=rounded([7,.19,4.5],.065,metal(0x1e2d34),[0,-.135,0]);
  const grid=new THREE.GridHelper(7,18,0x5c8995,0x324754);
  grid.position.y=-.033;
  bench.add(plinth,grid,baseFrame);
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
  function resetView(next:string) {
    if(next==='bench'){
      controls.minDistance=2.6;controls.maxDistance=17;
      controls.target.set(0,.8,0);
      camera.position.copy(controls.target).add(new THREE.Vector3(4.4,3.6,-5.2).multiplyScalar(fitViewScale));
    }else if(next==='preview'){
      controls.minDistance=8;controls.maxDistance=73;
      controls.target.set(-3,0,3);
      camera.position.copy(controls.target).add(new THREE.Vector3(16,27,26).multiplyScalar(fitViewScale));
    }else if(next==='cutscene'){
      controls.minDistance=3;controls.maxDistance=18;
      const [x,z]=missionSite.wreck;
      controls.target.set(x,.92,z);
      cutOffset.set(4.3,2.1,-4.8);
      camera.position.copy(controls.target).add(cutOffset);
    }else{
      controls.minDistance=3;controls.maxDistance=35;
      controls.target.copy(astra.model.position).add(new THREE.Vector3(0,1.09,0));
      camera.position.copy(controls.target).add(new THREE.Vector3(4.3,2.6,7.7).multiplyScalar(Math.min(fitViewScale,1.18)));
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
      if(moved>.003)astra.model.rotation.y=Math.atan2(priorX-save.x,priorZ-save.z);
      priorX=save.x;priorZ=save.z;
      onGround(astra.model,save.x,save.z);
      shadow.position.set(save.x,astra.model.position.y+.018,save.z);
      if(mode!==nextMode){mode=nextMode;sceneStarted=now;resetView(mode);}
      if(mode==='cutscene'){
        astra.model.rotation.y=Math.atan2(save.x-missionSite.wreck[0],save.z-missionSite.wreck[1]);
        if(!reduced.matches&&now-sceneStarted<1100){
          const t=(now-sceneStarted)/1100;
          const easing=1-(1-t)**3;
          camera.position.copy(cutOffset).applyAxisAngle(new THREE.Vector3(0,1,0),(1-easing)*.54)
            .multiplyScalar(1+(1-easing)*.28).add(controls.target);
        }
      }
      const scanned=(now-pulseAt)/750, collected=(now-pickupAt)/530, fitted=(now-fitAt)/620;
      const poseAmount=(age:number)=>reduced.matches||age<0||age>1?0:Math.sin(age*Math.PI);
      astra.pose(now/1000, moved>.003&&!reduced.matches&&mode==='field',
        collected<1?'pickup':scanned<1||cutscene?'scan':'idle',
        collected<1?poseAmount(collected):cutscene&&!reduced.matches?.7:poseAmount(scanned));
      benchAstra.pose(now/1000,false,'assemble',poseAmount(fitted));
      field.visible=mode!=='bench';
      sky.visible=field.visible;
      bench.visible=mode==='bench';
      world.background=bench.visible?benchBackground:null;
      world.fog=bench.visible?null:dust;
      wreck.visible=cutscene||save.phase==='recover';
      if(mode==='field'){
        target.copy(astra.model.position).add(new THREE.Vector3(0,1.09,0));
        camera.position.add(nextPos.copy(target).sub(controls.target));
        controls.target.copy(target);
      }
      for(const entry of fieldParts){
        const picking=entry.part.id===picked&&now-pickupAt<500&&!reduced.matches;
        entry.group.visible=save.phase==='recover'&&(!save.collected.includes(entry.part.id)||picking);
        if(picking){
          const blend=Math.min(1,(now-pickupAt)/500);
          entry.object.position.copy(nextPos.copy(astra.model.position).sub(entry.group.position).multiplyScalar(blend));
          entry.object.position.y+=.28+Math.sin(blend*Math.PI/2)*1.25;
        }else entry.object.position.set(0,.28,0);
        entry.object.rotation.y=reduced.matches?0:now*.0007;
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
    const old=fitViewScale;
    camera.aspect=w/h;
    fitViewScale=Math.max(1,1.02/camera.aspect);
    if(mode==='bench'||mode==='preview'){
      camera.position.sub(controls.target).multiplyScalar(fitViewScale/old).add(controls.target);
      controls.update();
    }
    camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);
  observer.observe(host);
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
