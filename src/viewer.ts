import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function showRover(host:HTMLElement,url:string,select:(part:number)=>void) {
  const stage=document.createElement('div');
  stage.className='rover-stage';
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  let model:THREE.Group;
  try {
    model=(await new GLTFLoader().loadAsync(url)).scene;
  } catch(error) {
    renderer.dispose();
    throw error;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.domElement.setAttribute('aria-hidden','true');
  stage.append(renderer.domElement);
  host.querySelector<HTMLElement>('#rover-fallback')!.hidden=true;
  host.querySelector<HTMLElement>('#viewer-status')!.hidden=true;
  host.append(stage);
  const scene=new THREE.Scene();
  const bounds=new THREE.Box3().setFromObject(model);
  const center=bounds.getCenter(new THREE.Vector3());
  const size=bounds.getSize(new THREE.Vector3());
  const scale=2.5/Math.max(size.x,size.y,size.z);
  model.position.sub(center.multiplyScalar(scale));
  model.scale.multiplyScalar(scale);
  scene.add(model);
  const camera=new THREE.PerspectiveCamera(34,1,0.1,100);
  camera.position.set(4.4,2.5,4.6);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.minDistance=2.8;
  controls.maxDistance=11;
  controls.enablePan=false;
  controls.target.set(0,0.05,0);
  controls.update();
  controls.saveState();
  scene.add(new THREE.HemisphereLight(0xfff1de,0xb38061,2.15));
  const key=new THREE.DirectionalLight(0xfff4e5,3.25);
  key.position.set(3,6,4); scene.add(key);
  const fill=new THREE.DirectionalLight(0xbbdaff,1.15);
  fill.position.set(-4,2,-3); scene.add(fill);

  const nodes=[model.getObjectByName('Pancam'),model.getObjectByName('Solar Panels')];
  const local=[new THREE.Vector3(0,size.y*scale*0.43,0.15),new THREE.Vector3(0.52,size.y*scale*0.08,0.12)];
  const hotspots=local.map((point,i)=>{
    const button=document.createElement('button');
    button.className='hotspot';
    button.type='button';
    button.textContent='0'+(i+1);
    button.tabIndex=-1;
    button.setAttribute('aria-label',i===0?'Inspect navigation cameras':'Inspect solar panels');
    button.addEventListener('click',()=>select(i));
    stage.append(button);
    return {button,point,named:nodes[i]};
  });
  const draw=()=>{
    renderer.render(scene,camera);
    for (const {button,point,named} of hotspots) {
      const projected=(named ? named.getWorldPosition(new THREE.Vector3()) : point.clone()).project(camera);
      button.style.left=(projected.x+1)*50+'%';
      button.style.top=(1-projected.y)*50+'%';
      button.hidden=Math.abs(projected.x)>.94||Math.abs(projected.y)>.91;
    }
  };
  const resize=()=>{
    const width=stage.clientWidth,height=stage.clientHeight;
    if(!width||!height)return;
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    draw();
  };
  new ResizeObserver(resize).observe(stage);
  controls.addEventListener('change',draw);
  const actions=document.querySelector<HTMLElement>('.view-actions')!;
  actions.hidden=false;
  actions.querySelectorAll<HTMLButtonElement>('button').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.view;
    if(action==='reset') {controls.reset();return;}
    const offset=camera.position.clone().sub(controls.target);
    const spherical=new THREE.Spherical().setFromVector3(offset);
    if(action==='left'||action==='right') spherical.theta+=action==='left'?-0.35:0.35;
    if(action==='in'||action==='out') spherical.radius=THREE.MathUtils.clamp(spherical.radius*(action==='in'?0.8:1.25),controls.minDistance,controls.maxDistance);
    camera.position.copy(offset.setFromSpherical(spherical).add(controls.target));
    controls.update(); draw();
  }));
  resize();
}
