// Rebuild the actual PlayCanvas asset from Astra's source rig and Bullet simulation.
// Node 24: node scripts/export-astra.mjs
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createCanvas,ImageData} from '@napi-rs/canvas';

// Native canvases expose data() as a method. GLTFExporter tests image.data
// to distinguish raw DataTextures from browser canvases, so hide that method.
function browserCanvas(width,height){const canvas=createCanvas(width,height);Object.defineProperty(canvas,'data',{value:undefined});return canvas;}

const cache=new URL('../artifacts/astra-export/',import.meta.url);await mkdir(cache,{recursive:true});
const modules=['astra','astra-rig','astra-physics','astra-materials','astra-eyes','astra-springs','geometry'];
const hashes={};
for(const name of modules){const source=await readFile(new URL(`../src/${name}.ts`,import.meta.url),'utf8');hashes[name]=createHash('sha256').update(source).digest('hex');await writeFile(new URL(`${name}.ts`,cache),source.replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${p}.ts'`));}
await writeFile(new URL('paint.ts',cache),'export function paintModel() {}');
await writeFile(new URL('astra-assets.ts',cache),'export function loadAstraAssets() { return Promise.resolve(globalThis.__astraExportAssets); }');
await writeFile(new URL('ammo.cjs',cache),await readFile(new URL('../public/vendor/astra/ammo.wasm.js',import.meta.url)));
const require=createRequire(import.meta.url),factory=require(new URL('ammo.cjs',cache).pathname);
const Ammo=await factory({wasmBinary:await readFile(new URL('../public/vendor/astra/ammo.wasm.wasm',import.meta.url))});
const source=await readFile(new URL('../public/vendor/astra/RobotExpressive.glb',import.meta.url));
const robot=await new GLTFLoader().parseAsync(source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength),'');
globalThis.__astraExportAssets={robot,Ammo};globalThis.matchMedia=()=>({matches:false});
globalThis.ImageData=ImageData;globalThis.HTMLCanvasElement=createCanvas(1,1).constructor;
globalThis.document={createElement(tag){assert.equal(tag,'canvas');const c=browserCanvas(1,1);c.toBlob=callback=>c.encode('png').then(bytes=>callback(new Blob([bytes],{type:'image/png'})));return c;}};
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});} readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result=`data:${blob.type};base64,${Buffer.from(b).toString('base64')}`;this.onloadend?.();});}};

const {createAstra}=await import(new URL('astra.ts',cache));
const astra=createAstra();await astra.ready;
let elapsed=0;const tick=(dt,walk,action,amount)=>{elapsed+=dt;astra.pose(elapsed,walk,action,amount);};
for(let i=0;i<180;i++)tick(1/60,0,'idle',0);
let serial=0;const used=new Set();astra.model.traverse(n=>{let name=n.name||'Astra part';while(used.has(name))name=(n.name||'Astra part')+' '+(++serial);n.name=name;used.add(name);});
const nodes=[];astra.model.traverse(n=>nodes.push(n));
const movingMeshes=['Shoulder cape','Shoulder fold','Flexible tail cable'].map(name=>astra.model.getObjectByName(name));
assert(movingMeshes.every(n=>n?.isMesh));
const bases=nodes.map(n=>({p:n.position.toArray(),q:n.quaternion.toArray(),s:n.scale.toArray()}));
const deform=movingMeshes.map(mesh=>({mesh,base:mesh.geometry.attributes.position.clone(),normal:mesh.geometry.attributes.normal.clone(),positions:[],normals:[]}));
const baked=[];
for(const spec of [
 {name:'Idle',walk:0,action:'idle',duration:4,frames:48},
 {name:'Walk',walk:1,action:'idle',duration:1/1.15,frames:24},
 {name:'Recover',walk:0,action:'pickup',duration:2.4,frames:48},
 {name:'Talk',walk:0,action:'talk',duration:3,frames:36},
]){
 for(let i=0;i<180;i++)tick(1/60,spec.walk,'idle',0);
 const values=nodes.map(()=>({p:[],q:[],s:[]})),times=[],offset=deform[0].positions.length;
 for(let f=0;f<=spec.frames;f++){
  const t=f/spec.frames*spec.duration,dt=spec.duration/spec.frames;
  const action=spec.action==='pickup'&&t>1.95?'idle':spec.action;
  tick(dt,spec.walk,action,action==='pickup'?(f?1:0):1);
  times.push(t);nodes.forEach((n,j)=>{values[j].p.push(...n.position.toArray());values[j].q.push(...n.quaternion.toArray());values[j].s.push(...n.scale.toArray());});
  for(const d of deform){d.positions.push(d.mesh.geometry.attributes.position.array.slice());d.normals.push(d.mesh.geometry.attributes.normal.array.slice());}
 }
 // Blend the final short settling interval to the first sample to remove the
 // visible loop snap. Recover includes its release/return within this interval.
 const settle=spec.name==='Walk'?4:8;
 for(let f=spec.frames-settle+1;f<=spec.frames;f++){
  const t=(f-(spec.frames-settle))/settle,w=t*t*(3-2*t);
  for(const v of values)for(const [key,stride]of [['p',3],['q',4],['s',3]]){
   if(key==='q'){const q=new THREE.Quaternion().fromArray(v.q,f*4).slerp(new THREE.Quaternion().fromArray(v.q,0),w);q.toArray(v.q,f*4);}
   else for(let k=0;k<stride;k++)v[key][f*stride+k]=THREE.MathUtils.lerp(v[key][f*stride+k],v[key][k],w);
  }
  for(const d of deform)for(const key of ['positions','normals']){const a=d[key][offset+f],b=d[key][offset];for(let k=0;k<a.length;k++)a[k]=THREE.MathUtils.lerp(a[k],b[k],w);}
 }
 baked.push({...spec,times,values,offset});console.log('Baked',spec.name);
}
const animated=nodes.map((n,j)=>Object.fromEntries(['p','q','s'].map(key=>[key,baked.some(clip=>clip.values[j][key].some((v,i)=>Math.abs(v-bases[j][key][i%bases[j][key].length])>1e-6))])));
const clips=baked.map(clip=>{
 const tracks=nodes.flatMap((n,j)=>[
  ...(animated[j].p?[new THREE.VectorKeyframeTrack(n.uuid+'.position',clip.times,clip.values[j].p)]:[]),
  ...(animated[j].q?[new THREE.QuaternionKeyframeTrack(n.uuid+'.quaternion',clip.times,clip.values[j].q)]:[]),
  ...(animated[j].s?[new THREE.VectorKeyframeTrack(n.uuid+'.scale',clip.times,clip.values[j].s)]:[]),
 ]);
 for(const d of deform){const count=d.positions.length,weights=new Float32Array(clip.times.length*count);for(let f=0;f<clip.times.length;f++)weights[f*count+clip.offset+f]=1;tracks.push(new THREE.NumberKeyframeTrack(d.mesh.uuid+'.morphTargetInfluences',clip.times,weights));}
 return new THREE.AnimationClip(clip.name,clip.duration,tracks);
});
nodes.forEach((n,i)=>{n.position.fromArray(bases[i].p);n.quaternion.fromArray(bases[i].q);n.scale.fromArray(bases[i].s);});
for(const d of deform){d.mesh.geometry.setAttribute('position',d.base);d.mesh.geometry.setAttribute('normal',d.normal);d.mesh.geometry.morphTargetsRelative=false;d.mesh.geometry.morphAttributes.position=d.positions.map(a=>new THREE.Float32BufferAttribute(a,3));d.mesh.geometry.morphAttributes.normal=d.normals.map(a=>new THREE.Float32BufferAttribute(a,3));d.mesh.updateMorphTargets();d.mesh.morphTargetInfluences[0]=1;}
const converted=new Map();
function textureCanvas(tex){if(!ArrayBuffer.isView(tex?.image?.data))return tex;if(converted.has(tex))return converted.get(tex);const {width,height,data}=tex.image,c=browserCanvas(width,height);c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data),width,height),0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=tex.colorSpace;t.flipY=tex.flipY;t.wrapS=tex.wrapS;t.wrapT=tex.wrapT;t.repeat.copy(tex.repeat);converted.set(tex,t);return t;}
astra.model.traverse(n=>{if(!n.isMesh)return;
 if(n.material.isShaderMaterial)n.material=new THREE.MeshStandardMaterial({color:0x031318,emissive:0x67e9df,emissiveIntensity:.2,roughness:.25});
 for(const m of Array.isArray(n.material)?n.material:[n.material])for(const key of ['map','roughnessMap','metalnessMap','normalMap','emissiveMap','alphaMap','aoMap'])m[key]=textureCanvas(m[key]);
});
astra.model.userData={...astra.model.userData,sourceRevision:hashes,authoredFor:'PlayCanvas',walkSpeed:.38/.62*1.15,headPreserved:true,animatedCloth:true};
astra.model.updateMatrixWorld(true);
const glb=await new GLTFExporter().parseAsync(astra.model,{binary:true,animations:clips,onlyVisible:true,maxTextureSize:512,copyright:'Astra design; RobotExpressive limb meshes by Quaternius (CC0). See public/vendor/astra/MODEL-LICENSE.md.'});
const output=new URL('../public/models/astra.glb',import.meta.url);await writeFile(output,new Uint8Array(glb));
const report={bytes:glb.byteLength,sha256:createHash('sha256').update(new Uint8Array(glb)).digest('hex'),source:hashes,animations:clips.map(c=>({name:c.name,duration:c.duration,tracks:c.tracks.length})),deformedMeshes:deform.map(d=>({name:d.mesh.name,targets:d.positions.length})),walkSpeed:.38/.62*1.15};
await writeFile(new URL('../public/models/astra-manifest.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));astra.dispose();
