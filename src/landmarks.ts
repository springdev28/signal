import * as THREE from 'three';
import { missionSite } from './mission';
import { box } from './geometry';
import { rockMaterial } from './paint';

/** Recognizable silhouettes shared by the recovered image clue and terrain. */
export function addSurveyLandmarks(group:THREE.Group,height:(x:number,z:number)=>number){
  const [spires,tracks]=missionSite.landmarks;
  const rock=rockMaterial(new THREE.MeshStandardMaterial({color:0xaf9180,roughness:1,emissive:0x192b3a,emissiveIntensity:.15}),false,.22);
  for(const [index,[dx,h,width]] of [[-1.4,7.8,1.25],[1.2,5.4,.96]].entries()){
    const p:number[]=[],uv:number[]=[],indices:number[]=[],color:number[]=[];const levels=20,sides=15;
    for(let j=0;j<levels;j++)for(let i=0;i<sides;i++){
      const t=j/(levels-1),a=i/sides*Math.PI*2;
      const r=width*(Math.pow(1-t,.65)*.87+.045)*(1+.12*Math.sin(i*2.4+index)+.06*Math.sin(j*2.2));
      const lean=.6*t*t*(index?-.6:1);
      p.push(Math.cos(a)*r+lean,h*t+Math.sin(a*3+index)*.12*t,Math.sin(a)*r*.7+Math.sin(t*2)*.2);
      uv.push(i/sides,t);const c=new THREE.Color(0xa98a73).multiplyScalar(.84+Math.sin(j*1.9)*.07+Math.cos(i*.7)*.08);color.push(c.r,c.g,c.b);
      if(j<levels-1){const a=j*sides+i,b=j*sides+(i+1)%sides;indices.push(a,a+sides,b,b,a+sides,b+sides);}
    }
    const cap=p.length/3;p.push(index?-.36:.6,h,Math.sin(2)*.2);uv.push(.5,1);color.push(.5,.4,.3);
    for(let i=0;i<sides;i++)indices.push((levels-1)*sides+i,cap,(levels-1)*sides+(i+1)%sides);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const material=rockMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,emissive:0x192b3a,emissiveIntensity:.15}),false,.22);
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(spires.position[0]+dx,height(...spires.position)-.1,spires.position[1]);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  }
  const tread=new THREE.MeshStandardMaterial({color:0x68554a,roughness:1});
  for(let i=0;i<30;i++)for(const dx of [-.55,.55]){
    const x=tracks.position[0]+Math.sin(i*.11)*1.25,z=tracks.position[1]+1-i*.25;
    const track=box(.27,.012,.075,tread,x+dx,height(x+dx,z)+.012,z);track.rotation.y=-i*.02;group.add(track);
  }
  rock.dispose();
}
