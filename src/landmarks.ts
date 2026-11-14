import * as THREE from 'three';
import { missionSite } from './mission';
import { box } from './geometry';
import { paintMaterial } from './paint';

/** The same physical landmarks appear in the downlink, cockpit and surface survey. */
export function addSurveyLandmarks(group:THREE.Group,height:(x:number,z:number)=>number){
  const rock=new THREE.MeshStandardMaterial({color:0x8b5945,roughness:1,flatShading:true});
  paintMaterial(rock,.45);
  const geometry=new THREE.DodecahedronGeometry(1,0),[spires,tracks]=missionSite.landmarks;
  for(const [dx,h] of [[-1,4.2],[.9,2.9]])for(let i=0;i<4;i++){
    const mesh=new THREE.Mesh(geometry,rock),width=(1-i*.185)*(1.1+(dx>0?.1:0));
    mesh.scale.set(width,h*.29,width*.89);mesh.position.set(spires.position[0]+dx+i*.125,height(...spires.position)+h*(.15+i*.2),spires.position[1]+i*.14);mesh.rotation.set(i*.44,.7+i*.49,-.15);mesh.castShadow=true;group.add(mesh);
  }
  for(let i=0;i<14;i++)for(const dx of [-.55,.55]){
    const x=tracks.position[0]+Math.sin(i*.22)*1.25,z=tracks.position[1]+1-i*.48;
    const track=box(.31,.014,.12,rock,x+dx,height(x+dx,z)+.025,z);track.rotation.y=-i*.04;group.add(track);
  }
}
