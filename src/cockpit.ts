import * as THREE from 'three';
import { barrel, metal, rounded, strut, tube } from './geometry';
import { paintModel } from './paint';
import { astraMaterial } from './astra-materials';

/** The pilot's station uses camera-space geometry; its instrument apertures
 * align with the accessible HTML controls at every viewport aspect ratio. */
export function createCockpit(camera: THREE.PerspectiveCamera) {
  const root=new THREE.Group();camera.add(root);
  const steel=astraMaterial(0x334b57,'steel',.65),edge=metal(0x79868a,.55,.64),brass=metal(0x99704c,.5,.68),rubber=metal(0x09131a,.12,.88);
  const light=new THREE.MeshStandardMaterial({color:0x79d8df,emissive:0x3e9cba,emissiveIntensity:1.9,roughness:.5});
  let width=0,height=0;
  function resize(w:number,h:number){
    while(root.children.length){const object=root.children[0];root.remove(object);object.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});}
    const z=-3.4,halfH=Math.tan(camera.fov*Math.PI/360)*-z,halfW=halfH*camera.aspect;
    width=w;height=h;
    const deckHeight=h<650?164:w<621?245:218;
    const lip=halfH*(deckHeight/h*2-1);
    const slab=rounded([halfW*2.35,halfH+lip+.28,.5],.08,steel,[0,(-halfH+lip)/2-.12,z-.02]);root.add(slab);
    const upper=rounded([halfW*2.1,.105,.31],.035,rubber,[0,lip+.05,z+.16]);root.add(upper);
    for(const side of [-1,1]){
      root.add(strut([side*halfW*.985,halfH*1.05,z],[side*halfW*.9,lip+.07,z],.055,steel,12));
      root.add(strut([side*halfW*.965,halfH*.96,z+.015],[side*halfW*.87,lip+.08,z+.015],.012,brass,10));
      root.add(tube([[side*halfW*.94,halfH*.6,z+.04],[side*halfW*.92,halfH*.3,z+.04],[side*halfW*.93,lip+.12,z+.04]],.014,rubber));
      root.add(rounded([halfW*.22,.04,.06],.009,light,[side*halfW*.67,lip+.105,z+.34]));
      for(let i=0;i<8;i++){
        const y=lip+(halfH-lip)*(i+.4)/8;
        root.add(barrel(.012,.013,brass,[side*(halfW*.9+(y-lip)/(halfH-lip)*halfW*.085),y,z+.059],'z',8));
      }
    }
    root.add(strut([-halfW,halfH*.96,z],[halfW,halfH*.96,z],.065,steel,12));
    // Bevelled recesses, bolts and a few scratches give the console a physical
    // edge without adding non-functional telemetry or repeated displays.
    for(let i=0;i<32;i++){
      const x=Math.sin(i*19.13)*halfW*.95,y=-halfH+.04+(i%5)*.027;
      const scratch=rounded([.018+(i%4)*.015,.003,.002],.001,edge,[x,y,z+.26]);scratch.rotation.z=Math.sin(i)*.4;root.add(scratch);
    }
    for(const side of [-1,1]){const glow=new THREE.PointLight(0x64cce5,1.8,5,2);glow.position.set(side*halfW*.65,lip+.23,z+1.1);root.add(glow);}
    paintModel(root,.65);
  }
  return {root,resize,animate(bank:number,throttle:number){
    // Small inertial roll in the framing, the horizon banks with the ship.
    root.rotation.z=-bank*.09;
    root.position.y=Math.sin(performance.now()*.014)*throttle*.001;
  },dimensions:()=>({width,height})};
}
