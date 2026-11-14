import * as THREE from 'three';
import { createTerrain } from './terrain';
import { createShip } from './ship';
import { createAstra } from './astra';
import { landingSite, type FlightSave } from './flight-state';
import { addSurveyLandmarks } from './landmarks';

export type FlightFrame={state:FlightSave;throttle:number;steer:number;pitch:number;time:number;scan:number;hatch:number;exit:number;touchdown:number};
export function createFlightScene(host:HTMLElement,radar:HTMLCanvasElement){
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Cockpit view. Drag to look. Use WASD to steer, Q and E for throttle, Space to scan.');
  const scene=new THREE.Scene(),terrain=createTerrain(scene,'mars');scene.fog=terrain.fog;
  addSurveyLandmarks(terrain.group,terrain.height);
  const radarTexture=new THREE.CanvasTexture(radar);radarTexture.colorSpace=THREE.SRGBColorSpace;
  const craft=createShip(radarTexture);craft.ship.scale.setScalar(1.5);scene.add(craft.ship);
  const camera=new THREE.PerspectiveCamera(67,1,.045,500);
  const astra=createAstra();scene.add(astra.model);astra.model.visible=false;
  const landingRing=new THREE.Mesh(new THREE.RingGeometry(4.9,5.08,70),new THREE.MeshBasicMaterial({color:0x8fdce4,transparent:true,opacity:.7,side:THREE.DoubleSide}));
  landingRing.rotation.x=-Math.PI/2;landingRing.position.set(landingSite.x,terrain.height(landingSite.x,landingSite.z)+.08,landingSite.z);scene.add(landingRing);
  const beacons=[0,1,2].map(()=>{
    const line=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,12,6),new THREE.MeshBasicMaterial({color:0x74dcdd,transparent:true,opacity:.5}));scene.add(line);return line;
  });
  const dustCanvas=document.createElement('canvas');dustCanvas.width=dustCanvas.height=128;
  const brush=dustCanvas.getContext('2d')!;
  const gradient=brush.createRadialGradient(64,64,1,64,64,62);gradient.addColorStop(0,'#fff5dbaa');gradient.addColorStop(.5,'#efd0a176');gradient.addColorStop(1,'#b3744100');
  brush.fillStyle=gradient;brush.fillRect(0,0,128,128);
  const dustTexture=new THREE.CanvasTexture(dustCanvas);
  const dust=Array.from({length:34},()=>{
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:dustTexture,color:0xc59161,transparent:true,depthWrite:false,opacity:0}));scene.add(sprite);return sprite;
  });
  let lookX=0,lookY=0,drag:PointerEvent|undefined,bank=0,lastTime=0,exterior=false;
  renderer.domElement.addEventListener('pointerdown',e=>{drag=e;renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;lookX=THREE.MathUtils.clamp(lookX+(e.clientX-drag.clientX)*.003,-.6,.6);lookY=THREE.MathUtils.clamp(lookY+(e.clientY-drag.clientY)*.002,-.25,.32);drag=e;});
  for(const event of ['pointerup','pointercancel'])renderer.domElement.addEventListener(event,()=>{drag=undefined;});
  const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight,false);};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const local=new THREE.Vector3(),target=new THREE.Vector3(),offset=new THREE.Vector3();
  function draw(frame:FlightFrame){
    const {state,time,throttle,hatch,exit,touchdown}=frame;
    const dt=Math.min(.05,time-lastTime);lastTime=time;
    bank=THREE.MathUtils.damp(bank,-frame.steer*.24,5,dt||.016);
    const ground=terrain.height(state.x,state.z);
    const landing=['landing','landed','exit'].includes(state.phase),outside=exterior||landing;
    craft.ship.position.set(state.x,ground+state.altitude+.12,state.z);
    craft.ship.rotation.set(frame.pitch*.13,-state.heading,bank);
    craft.ship.updateMatrixWorld(true);
    craft.hatch.rotation.x=-hatch*Math.PI/2;
    craft.hatch.visible=outside;
    craft.shell.visible=outside;craft.canopy.visible=outside;
    craft.exteriorTrim.visible=outside;
    craft.interior.visible=!outside;
    for(const jet of craft.jets){jet.visible=!landing&&throttle>.02;jet.scale.y=.3+throttle*2.5;jet.material.opacity=.2+throttle*.45;}
    for(const jet of craft.downJets){jet.visible=state.phase==='landing';jet.scale.y=.4+Math.min(1,state.altitude/8)*1.1;}
    if(outside){
      camera.up.set(0,1,0);
      const azimuth=-state.heading+.65+(landing?Math.PI:0);
      offset.set(Math.sin(azimuth)*12,5.1,Math.cos(azimuth)*12);
      target.set(state.x,ground+state.altitude+1.3,state.z);
      if(state.phase==='exit')target.lerp(astra.model.position.clone().add(new THREE.Vector3(0,1.3,0)),Math.min(1,exit*.75));
      camera.position.copy(target).add(offset);camera.lookAt(target);
    }else{
      camera.position.copy(craft.ship.localToWorld(local.set(0,2,.85)));
      target.copy(craft.ship.localToWorld(local.set(Math.sin(lookX)*4,-.1+lookY*4,-5)));
      camera.up.set(-Math.sin(bank),Math.cos(bank),0);camera.lookAt(target);
    }
    if(outside)camera.up.set(0,1,0);
    astra.model.visible=hatch>.5;
    if(astra.model.visible){
      local.set(0,.13,-2.6-exit*3.7);craft.ship.localToWorld(local);
      local.y=terrain.height(local.x,local.z)+Math.max(0,.55*(1-exit));astra.model.position.copy(local);
      astra.model.rotation.y=-state.heading;astra.pose(time,exit>0&&exit<1,state.phase==='landed'?'talk':'idle',0);
    }
    landingRing.visible=state.phase==='approach'||state.phase==='landing';
    Object.values(state.contacts).forEach((contact,i)=>{
      const beacon=beacons[i];beacon.visible=contact.locked&&state.phase==='approach';
      beacon.position.set(contact.x,terrain.height(contact.x,contact.z)+6,contact.z);
    });
    const dusty=state.phase==='landing'&&state.altitude<7||['landed','exit'].includes(state.phase)&&touchdown<3.4;
    for(const [i,sprite] of dust.entries()){
      const age=(time*.7+i*.14)%1,angle=i*2.399;
      sprite.visible=dusty;
      sprite.position.set(state.x+Math.cos(angle)*(1+age*9),ground+.25+age*1.7,state.z+Math.sin(angle)*(1+age*9));
      sprite.scale.setScalar(1.5+age*4);sprite.material.opacity=(1-age)*.22;
    }
    radarTexture.needsUpdate=true;
    renderer.render(scene,camera);
    host.dataset.bank=bank.toFixed(3);host.dataset.hatch=hatch.toFixed(2);host.dataset.thrust=throttle.toFixed(2);
  }
  return {draw,toggleCamera(){exterior=!exterior;return exterior;},exitPosition:()=>({x:astra.model.position.x,z:astra.model.position.z}),dispose(){observer.disconnect();renderer.dispose();host.querySelector('canvas')?.remove();},resetLook(){lookX=lookY=0;}};
}
