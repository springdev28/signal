import * as THREE from 'three';
import type { PartId } from './mission';

const alloy = new THREE.MeshStandardMaterial({color:0xc9ae83,metalness:.25,roughness:.58});
const frame = new THREE.MeshStandardMaterial({color:0x938879,metalness:.35,roughness:.58});
const dark = new THREE.MeshStandardMaterial({color:0x292726,roughness:.82});
const cells = new THREE.MeshStandardMaterial({color:0x294965,metalness:.35,roughness:.38});
const glass = new THREE.MeshStandardMaterial({color:0x77d5e1,metalness:.3,roughness:.25});
const accent = new THREE.MeshStandardMaterial({color:0xecc966});

export function box(w:number,h:number,d:number,material:THREE.Material,x=0,y=0,z=0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);
  return mesh;
}

export function makePart(id:PartId) {
  const group = new THREE.Group();
  if (id === 'camera') {
    group.add(box(.11,.55,.11,frame,0,.21),box(.51,.17,.21,alloy,0,.51));
    for (const x of [-.16,.16]) {
      group.add(box(.13,.12,.055,dark,x,.51,-.13),box(.068,.068,.02,glass,x,.51,-.166));
    }
    group.add(box(.08,.04,.05,accent,0,.61,-.08));
  }
  if (id === 'solar') {
    group.add(box(1.05,.085,2.05,frame));
    for (const x of [-.32,0,.32]) for (let z=-.79;z<.9;z+=.31) {
      group.add(box(.28,.027,.28,cells,x,.053,z));
    }
    group.add(box(.03,.04,1.99,accent,.515,.058));
  }
  if (id === 'wheel') {
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.25,14),dark);
    tire.rotation.z=Math.PI/2;
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.04,12),alloy);
    hub.rotation.z=Math.PI/2;
    hub.position.x=-.15;
    group.add(tire,hub,box(.025,.09,.09,accent,-.18));
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6;
      const tread=box(.27,.046,.075,frame,0,Math.cos(angle)*.336,Math.sin(angle)*.336);
      tread.rotation.x=angle;
      group.add(tread);
    }
  }
  return group;
}

export function roverFrame(withWheels=true) {
  const group=new THREE.Group();
  group.add(box(1.54,.43,1.9,alloy,0,.59),box(1.63,.12,2.04,frame,0,.83),
    box(.37,.17,.13,accent,0,.66,-1.01),box(.4,.09,.31,frame,0,1.02,-.55),
    box(.16,.34,.16,alloy,0,1.13,-.55),box(.35,.12,.22,frame,0,.9,.33));
  for (const side of [-1,1]) {
    group.add(box(.19,.13,1.83,frame,side*.91,.43));
    for (const z of [-.83,0,.83]) {
      if (!withWheels && side===1 && z===0) continue;
      const wheel=makePart('wheel');
      wheel.position.set(side*1.12,.4,z);
      wheel.rotation.y=side===1?Math.PI:0;
      group.add(wheel);
    }
  }
  return group;
}
