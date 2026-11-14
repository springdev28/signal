import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const dir=new URL('../artifacts/astra-joint-test/',import.meta.url);await mkdir(dir,{recursive:true});
for(const name of ['astra-materials','astra-rig']){
 const source=await readFile(new URL(`../src/${name}.ts`,import.meta.url),'utf8');
 const code=source.replace("'./astra-materials'","'./astra-materials.ts'");
 await writeFile(new URL(`${name}.ts`,dir),code);
}
const {createRobotRig}=await import(new URL('astra-rig.ts',dir));
const buffer=await readFile(new URL('../public/vendor/astra/RobotExpressive.glb',import.meta.url));
const source=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
const rig=createRobotRig(source),root=new THREE.Group();root.add(rig.model);
let time=0,maxError=0,minFoot=Infinity,maxSupport=0,maxLift=0,maxHandGap=0;const samples=[];
for(const [action,speed,amount]of [['idle',0,0],['idle',1,0],['scan',0,1],['pickup',0,1],['idle',0,0]]){
 for(let i=0;i<180;i++){
  time+=1/60;rig.update(1/60,time,speed,action,amount);
  const inspect=rig.inspect();maxError=Math.max(maxError,inspect.maxJointError);
  minFoot=Math.min(minFoot,...inspect.feet);maxSupport=Math.max(maxSupport,Math.min(...inspect.feet));maxLift=Math.max(maxLift,...inspect.feet);
  for(const side of ['L','R']){
   const elbow=rig.localPosition(`LowerArm${side}`),wrist=rig.localPosition(`Palm2${side}`);
   const meshes=[];rig.asset.traverse(n=>{if(n.isSkinnedMesh&&n.name.startsWith(`Hand${side}`))meshes.push(n);});
   // Every imported hand must remain finite after the retarget and skin update.
   for(const mesh of meshes){mesh.skeleton.update();const box=new THREE.Box3().setFromObject(mesh,true);for(const v of [...box.min,...box.max])assert(Number.isFinite(v));}
   maxHandGap=Math.max(maxHandGap,elbow.distanceTo(wrist));
  }
 }
 samples.push({action,speed,feet:rig.inspect().feet,shoulder:rig.localPosition('ShoulderL').toArray(),wrist:rig.localPosition('Palm2L').toArray()});
}
assert(maxError<1e-5,'Hip, knee and ankle segment lengths must agree.');
assert(minFoot>=0,'No foot may penetrate the floor.');assert(maxSupport<1e-7,'At least one supporting foot must remain planted.');assert(maxLift>.08,'The swing foot must lift.');assert(maxHandGap<.51,'Forearms must retain Astra proportions.');
const locomotion=[];
for(const fps of [15,30,60]){
 const moving=createRobotRig(source),root=new THREE.Group();root.add(moving.model);
 const last=[new THREE.Vector3(),new THREE.Vector3()],planted=[false,false];
 let maxSlide=0,contacts=0,maxTerrainError=0,maxSlopeJointError=0;
 for(let frame=0;frame<fps*8;frame++){
  const slope=frame>=fps*4,dt=1/fps;
  const terrain=(x,z)=>slope?.16*x+.12*z:0;
  root.position.z-=dt*1.25;root.position.y=terrain(0,root.position.z);
  moving.setGroundHeight(terrain);moving.update(dt,frame*dt,1,'idle',0);
  maxSlopeJointError=Math.max(maxSlopeJointError,moving.inspect().maxJointError);
  const relative=moving.feet.map((foot,i)=>{
   const p=foot.getWorldPosition(new THREE.Vector3()),height=p.y-terrain(p.x,p.z),onGround=Math.abs(height)<1e-7;
   if(frame>fps&&frame<fps*4&&onGround&&planted[i]){maxSlide=Math.max(maxSlide,p.distanceTo(last[i]));contacts++;}
   last[i].copy(p);planted[i]=onGround;return height;
  });
  maxTerrainError=Math.max(maxTerrainError,Math.abs(Math.min(...relative)));
 }
 assert(contacts>fps,'The moving rig must have sustained support contacts.');
 assert(maxSlide<.0001,`Supporting feet slide at ${fps} fps: ${maxSlide}`);
 assert(maxTerrainError<1e-7,'A supporting foot must land on the sampled terrain.');
 assert(maxSlopeJointError<1e-5,'Slope adaptation must not stretch the legs.');
 locomotion.push({fps,contacts,maxSlide,maxTerrainError,maxSlopeJointError});moving.dispose();
}
const report={poses:900,maxJointError:maxError,minFoot,maxSupport,maxLift,maxForearmLength:maxHandGap,samples,locomotion};
await writeFile(new URL('report.json',dir),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));rig.dispose();
