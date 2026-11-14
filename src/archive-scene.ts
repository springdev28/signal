import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { box, makePart, roverFrame } from './rover-art';
import { missionSite } from './mission';

type Exhibit = 'opportunity'|'lunar'|'moon'|'mars';

function lunarRover(){
  const metal=new THREE.MeshStandardMaterial({color:0xb6b4a6,metalness:.36,roughness:.55});
  const seats=new THREE.MeshStandardMaterial({color:0x6c7877,roughness:.8});
  const instrument=new THREE.MeshStandardMaterial({color:0xc6a35b,metalness:.2});
  const group=new THREE.Group();
  group.add(box(1.16,.14,1.9,metal,0,.43),box(1.06,.12,.5,instrument,0,.52,-.65),box(.92,.21,.55,metal,0,.56,.64));
  for(const x of [-.31,.31]){
    group.add(box(.38,.09,.36,seats,x,.57,.05),box(.38,.48,.07,seats,x,.8,.24));
  }
  for(const x of [-.79,.79])for(const z of [-.69,.69]){
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.19,12,1,false),metal);
    tire.rotation.z=Math.PI/2;tire.position.set(x,.32,z);group.add(tire,box(.5,.064,.11,metal,x*.75,.38,z));
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.286,.286,.196,12,2,true),new THREE.MeshBasicMaterial({color:0x554f46,wireframe:true}));
    mesh.rotation.z=Math.PI/2;mesh.position.copy(tire.position);group.add(mesh);
  }
  const dish=new THREE.Mesh(new THREE.SphereGeometry(.32,16,10,0,Math.PI*2,0,Math.PI*.36),new THREE.MeshStandardMaterial({color:0xd8d1b8,side:THREE.DoubleSide}));
  dish.rotation.z=.68;dish.position.set(-.37,1.04,-.66);
  group.add(dish,box(.045,.55,.045,metal,-.37,.75,-.66));
  return group;
}

function worldModel(mode:'moon'|'mars'){
  const moon=mode==='moon';
  const sphere=new THREE.SphereGeometry(1.02,96,64);
  const points=sphere.getAttribute('position');
  const colors=[];
  const light=new THREE.Color(moon?0xa5a49a:0xba7153),dark=new THREE.Color(moon?0x5f615d:0x723a2b);
  for(let i=0;i<points.count;i++){
    const x=points.getX(i),y=points.getY(i),z=points.getZ(i);
    const noise=(Math.sin(x*7+y*4)*Math.cos(z*6)+Math.sin(z*16+x*13)*.31+Math.cos(y*34-z*19)*.12)/2+.48;
    const color=dark.clone().lerp(light,Math.max(0,Math.min(1,noise)));
    if(!moon&&Math.abs(y)>.89)color.lerp(new THREE.Color(0xd9d7cc),Math.min(1,(Math.abs(y)-.89)*9));
    colors.push(color.r,color.g,color.b);
    const elevation=1+(noise-.5)*.015;
    points.setXYZ(i,x*elevation,y*elevation,z*elevation);
  }
  sphere.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  sphere.computeVertexNormals();
  const globe=new THREE.Group();
  globe.add(new THREE.Mesh(sphere,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
  return globe;
}

export function showArchiveModel(host:HTMLElement,mode:Exhibit,select:(part:number)=>void){
  const stage=document.createElement('div');
  stage.className='rover-stage';
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.domElement.setAttribute('aria-hidden','true');
  const world=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,60);
  const isGlobe=mode==='moon'||mode==='mars';
  const model=mode==='opportunity'?roverFrame(false):mode==='lunar'?lunarRover():worldModel(mode);
  if(mode==='opportunity'){
    for(const part of missionSite.parts){
      const mesh=makePart(part.id);
      mesh.position.set(part.contact[0],part.contact[1],part.contact[2]);
      mesh.rotation.y=part.angle*Math.PI/180;
      model.add(mesh);
    }
  }
  if(!isGlobe)model.position.y=-.53;
  model.rotation.y=isGlobe?.55:2.75;
  world.add(model,new THREE.HemisphereLight(0xfff0d5,0x8a624c,2));
  const light=new THREE.DirectionalLight(0xffead2,2.5);
  light.position.set(4,6,5);world.add(light);
  camera.position.set(...(isGlobe?[.3,1.15,4.3]:[3.1,2.35,4.4]) as [number,number,number]);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;
  controls.minDistance=2.35;controls.maxDistance=9;
  controls.update();controls.saveState();
  stage.append(renderer.domElement);
  host.append(stage);
  host.querySelector<HTMLElement>('.model-fallback')!.hidden=true;
  host.querySelector<HTMLElement>('.model-status')!.hidden=true;
  const coords=mode==='lunar'?[[.8,.31,.69],[.31,.91,.24]]:[[0,1.82,-.62],[.52,.96,.29]];
  const hotspots=isGlobe?[]:coords.map(([x,y,z],i)=>{
    const button=document.createElement('button');
    button.className='hotspot';button.type='button';button.tabIndex=-1;
    button.textContent=i===0?'1':'2';
    button.setAttribute('aria-label',i===0?'Inspect first instrument':'Inspect second instrument');
    button.addEventListener('click',()=>select(i));stage.append(button);
    return {button,point:new THREE.Vector3(x,y,z)};
  });
  function draw(){
    renderer.render(world,camera);
    for(const {button,point} of hotspots){
      const projected=model.localToWorld(point.clone()).project(camera);
      button.style.left=(projected.x+1)*50+'%';
      button.style.top=(1-projected.y)*50+'%';
      button.hidden=Math.abs(projected.x)>.93||Math.abs(projected.y)>.89;
    }
  }
  function resize(){
    if(!stage.clientWidth||!stage.clientHeight)return;
    camera.aspect=stage.clientWidth/stage.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(stage.clientWidth,stage.clientHeight,false);
    draw();
  }
  new ResizeObserver(resize).observe(stage);
  controls.addEventListener('change',draw);
  const actions=host.parentElement!.querySelector<HTMLElement>('.view-actions')!;
  actions.hidden=false;
  actions.querySelectorAll<HTMLButtonElement>('button').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.view;
    if(action==='reset'){controls.reset();return;}
    const offset=camera.position.clone().sub(controls.target);
    const orbit=new THREE.Spherical().setFromVector3(offset);
    if(action==='left'||action==='right')orbit.theta+=action==='left'?-.36:.36;
    else orbit.radius=THREE.MathUtils.clamp(orbit.radius*(action==='in'?.8:1.25),controls.minDistance,controls.maxDistance);
    camera.position.copy(offset.setFromSpherical(orbit).add(controls.target));
    controls.update();draw();
  }));
  resize();
}
