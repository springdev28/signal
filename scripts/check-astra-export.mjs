// Validate the shipped asset, including failures that a source-rig test cannot see.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const bytes=await readFile(new URL('../public/models/astra.glb',import.meta.url));
const manifest=JSON.parse(await readFile(new URL('../public/models/astra-manifest.json',import.meta.url),'utf8'));
assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256,'Manifest must describe the shipped GLB.');
for(const [name,hash] of Object.entries(manifest.source)){
  const source=await readFile(new URL(`../src/${name}.ts`,import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'),hash,`Re-export changed source: ${name}`);
}
const jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength)),bin=bytes.subarray(28+jsonLength);
assert.deepEqual(json.animations.map(a=>a.name),['Idle','Walk','Recover','Talk']);
for(const animation of json.animations){
  const morphs=animation.channels.filter(c=>c.target.path==='weights');
  assert.equal(morphs.length,3,`${animation.name} must animate the cape, fold and tail.`);
}
const colorImages=new Set(json.materials.flatMap(m=>m.pbrMetallicRoughness?.baseColorTexture?[json.textures[m.pbrMetallicRoughness.baseColorTexture.index].source]:[]));
const textureMeans=[];
for(const index of colorImages){
  const image=json.images[index],view=json.bufferViews[image.bufferView],start=view.byteOffset??0;
  const decoded=await loadImage(bin.subarray(start,start+view.byteLength)),canvas=createCanvas(decoded.width,decoded.height);
  const context=canvas.getContext('2d');context.drawImage(decoded,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
  let total=0,alpha=0;for(let i=0;i<pixels.length;i+=4){total+=pixels[i]+pixels[i+1]+pixels[i+2];alpha+=pixels[i+3];}
  const mean=total/(pixels.length/4*3);assert(mean>30,`Base-color texture ${index} exported black.`);assert(alpha/pixels.length*4>250,'Surface texture must remain opaque.');textureMeans.push({index,mean});
}

// Read the exact exported transforms without a browser/image decoder. Geometry,
// skinning and animation stay intact; materials do not affect the grip test.
const geometryOnly=structuredClone(json);delete geometryOnly.images;delete geometryOnly.textures;delete geometryOnly.materials;
for(const mesh of geometryOnly.meshes)for(const primitive of mesh.primitives)delete primitive.material;
let encoded=Buffer.from(JSON.stringify(geometryOnly));encoded=Buffer.concat([encoded,Buffer.alloc((4-encoded.length%4)%4,32)]);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+encoded.length+bin.length,8);header.writeUInt32LE(encoded.length,12);header.writeUInt32LE(0x4e4f534a,16);
const binaryHeader=Buffer.alloc(8);binaryHeader.writeUInt32LE(bin.length);binaryHeader.writeUInt32LE(0x004e4942,4);
const packed=Buffer.concat([header,encoded,binaryHeader,bin]);
const gltf=await new GLTFLoader().parseAsync(packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength),'');
const mixer=new THREE.AnimationMixer(gltf.scene),claw=gltf.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName('Three-finger tail claw'));assert(claw);
const recovery=gltf.animations.find(a=>a.name==='Recover');mixer.clipAction(recovery).play();
let minimumGripHeight=Infinity,maximumGripHeight=-Infinity,minimumTargetDistance=Infinity;
const point=new THREE.Vector3(),target=new THREE.Vector3(.45,.075,-.75);
for(let f=0;f<144;f++){
  mixer.setTime(f/60);gltf.scene.updateMatrixWorld(true);point.set(0,.29,0).applyMatrix4(claw.matrixWorld);
  minimumGripHeight=Math.min(minimumGripHeight,point.y);maximumGripHeight=Math.max(maximumGripHeight,point.y);minimumTargetDistance=Math.min(minimumTargetDistance,point.distanceTo(target));
}
assert(minimumGripHeight>.015,'Exported clamp must not penetrate the ground.');
assert(minimumTargetDistance<.10,'Exported recovery must reach the sample instead of hovering above it.');
assert(maximumGripHeight-minimumGripHeight>.4,'Exported tail must visibly reach and lift.');
console.log(JSON.stringify({bytes:bytes.length,clips:json.animations.map(a=>a.name),textureMeans,minimumGripHeight,minimumTargetDistance,maximumGripHeight},null,2));
