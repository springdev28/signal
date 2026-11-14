// CPU-only regression: exercise the actual rig and Bullet world without a browser.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const dir=new URL('../artifacts/astra-simulation-test/',import.meta.url);await mkdir(dir,{recursive:true});
const modules=['astra','astra-rig','astra-physics','astra-materials','astra-eyes','astra-springs','geometry'];
for(const name of modules){let code=await readFile(new URL(`../src/${name}.ts`,import.meta.url),'utf8');code=code.replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${path}.ts'`);await writeFile(new URL(`${name}.ts`,dir),code);}
await writeFile(new URL('paint.ts',dir),'export function paintModel() {}');
await writeFile(new URL('astra-assets.ts',dir),'export function loadAstraAssets() {return Promise.resolve(globalThis.__astraTestAssets);}');
await writeFile(new URL('ammo.cjs',dir),await readFile(new URL('../public/vendor/astra/ammo.wasm.js',import.meta.url)));
const require=createRequire(import.meta.url),factory=require(new URL('ammo.cjs',dir).pathname);
const Ammo=await factory({wasmBinary:await readFile(new URL('../public/vendor/astra/ammo.wasm.wasm',import.meta.url))});
const buffer=await readFile(new URL('../public/vendor/astra/RobotExpressive.glb',import.meta.url));
const robot=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
globalThis.__astraTestAssets={robot,Ammo};globalThis.matchMedia=()=>({matches:false});
const {createAstra}=await import(new URL('astra.ts',dir));const astra=createAstra();astra.model.rotation.y=Math.PI;await astra.ready;
let time=0,maxStretch=0,maxAnchor=0,minimumClawY=Infinity;const phases=[],sample=new THREE.Vector3(-.45,.075,.75);let closestGrip=Infinity,graspDistance=Infinity;
for(const [action,walking,amount,frames]of [['idle',0,0,180],['idle',1,0,240],['scan',0,1,120],['idle',0,0,90],['pickup',0,1,135],['idle',0,0,120]]){
 let phaseStretch=0;
 for(let i=0;i<frames;i++){
  time+=1/60;astra.pose(time,walking,action,amount);
  const r=astra.inspectRig();for(const c of r.physics.cloth){phaseStretch=Math.max(phaseStretch,c.maxStretch);maxStretch=Math.max(maxStretch,c.maxStretch);maxAnchor=Math.max(maxAnchor,c.anchorError);}
  if(action==='pickup'){
   const p=astra.gripPoint();closestGrip=Math.min(closestGrip,p.distanceTo(sample));
   if(r.clampClosed>.75&&r.pickupElapsed<1.15)graspDistance=Math.min(graspDistance,p.distanceTo(sample));
   const claw=astra.model.getObjectByName('Three-finger tail claw');const bounds=new THREE.Box3().setFromObject(claw,true);minimumClawY=Math.min(minimumClawY,bounds.min.y);
  }
 }
 phases.push({action,walking,maxStretch:phaseStretch,cloth:astra.inspectRig().physics.cloth,rig:astra.inspectRig().rig});
}
// Frame-rate changes must not desynchronize the clamp from its contact point.
const recoveryRates=[];
for(const hz of [15,30,60]){
 for(let i=0;i<hz;i++){time+=1/hz;astra.pose(time,0,'idle',0);}
 let gap=Infinity,floor=Infinity;
 for(let i=0;i<Math.ceil(hz*2.1);i++){
  time+=1/hz;astra.pose(time,0,'pickup',1);const r=astra.inspectRig();
  if(r.clampClosed>.75&&r.pickupElapsed<1.15)gap=Math.min(gap,astra.gripPoint().distanceTo(sample));
  floor=Math.min(floor,new THREE.Box3().setFromObject(astra.model.getObjectByName('Three-finger tail claw'),true).min.y);
 }
 recoveryRates.push({hz,graspDistance:gap,clawClearance:floor});

}
const report={recoveryRates,poses:885,maxStretch,maxAnchor,minimumClawY,closestGrip,graspDistance,phases};await writeFile(new URL('report.json',dir),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
for(const r of recoveryRates){assert(r.graspDistance<.10,`Clamp missed at ${r.hz} fps`);assert(r.clawClearance>0,`Claw crossed floor at ${r.hz} fps`);}
assert(maxAnchor<1e-5);assert(maxStretch<.45);assert(graspDistance<.10,'Clamp must meet the sample before lifting it.');assert(minimumClawY>-.005,'Claw tips may not pass through the floor.');astra.dispose();
