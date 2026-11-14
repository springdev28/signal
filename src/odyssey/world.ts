import * as pc from 'playcanvas';
import {asset,base} from '../catalog';
import type {Chapter} from './state';
export const color=(hex:number)=>new pc.Color((hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255);
export function material(hex:number,metal=0,gloss=.25){const m=new pc.StandardMaterial();m.diffuse.copy(color(hex));m.useMetalness=true;m.metalness=metal;m.gloss=gloss;m.update();return m;}
export function primitive(parent:pc.Entity,name:string,type:'box'|'sphere'|'plane'|'cylinder'|'cone'|'capsule',p:number[],scale:number[],m:pc.Material,rotation=[0,0,0]){const e=new pc.Entity(name);e.addComponent('render',{type,material:m,castShadows:true,receiveShadows:true});e.setLocalPosition(p[0],p[1],p[2]);e.setLocalScale(scale[0],scale[1],scale[2]);e.setLocalEulerAngles(rotation[0],rotation[1],rotation[2]);parent.addChild(e);return e;}
export function beam(parent:pc.Entity,a:number[],b:number[],radius:number,m:pc.Material,name='frame'){const av=new pc.Vec3(...a),bv=new pc.Vec3(...b),e=primitive(parent,name,'cylinder',a,[radius,bv.clone().sub(av).length(),radius],m);e.setLocalPosition(av.clone().add(bv).mulScalar(.5));e.setLocalRotation(new pc.Quat().setFromDirections(pc.Vec3.UP,bv.sub(av).normalize()));return e;}
export function meshEntity(app:pc.AppBase,parent:pc.Entity,name:string,positions:number[],indices:number[],uvs:number[],m:pc.Material,colors?:number[]){const mesh=new pc.Mesh(app.graphicsDevice);mesh.setPositions(positions);mesh.setNormals(pc.calculateNormals(positions,indices));mesh.setUvs(0,uvs);mesh.setIndices(indices);if(colors)mesh.setColors(colors);mesh.update();const e=new pc.Entity(name);e.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,m)],castShadows:true,receiveShadows:true});parent.addChild(e);return e;}
export const height=(x:number,z:number)=>Math.sin(z*.027)*1.3+Math.sin(x*.065+z*.017)*.6+Math.cos(x*.09-z*.045)*.3;
export async function texture(app:pc.AppBase,url:string){return new Promise<pc.Texture>((resolve,reject)=>app.assets.loadFromUrl(url,'texture',(err,a)=>err?reject(err):resolve(a!.resource!)));}
export async function model(app:pc.AppBase,name:string){return new Promise<{entity:pc.Entity;resource:pc.ContainerResource}>((resolve,reject)=>app.assets.loadFromUrl(base+'models/'+name,'container',(err,a)=>err?reject(err):resolve({entity:a!.resource!.instantiateRenderEntity(),resource:a!.resource!})));}
function seeded(seed:number){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export async function landscape(app:pc.AppBase,chapter:Chapter){
 const root=new pc.Entity('Authored canyon');app.root.addChild(root);const moon=chapter==='moon';
 const rock=material(moon?0x858d99:0xa99a87,0,.13);rock.diffuseMap=await texture(app,asset('painted-strata.webp'));rock.diffuseMapTiling.set(1.2,1.2);rock.diffuseVertexColor=true;rock.update();
 const sand=material(moon?0x646e7b:0xa4876c,0,.09);sand.diffuseMap=await texture(app,asset('painted-surface.jpg'));sand.diffuseMapTiling.set(5,5);sand.diffuseVertexColor=true;sand.update();
 const p:number[]=[],idx:number[]=[],uv:number[]=[],cs:number[]=[];const n=140,size=650;
 for(let z=0;z<=n;z++)for(let x=0;x<=n;x++){const wx=(x/n-.5)*size,wz=(z/n-.65)*size;p.push(wx,height(wx,wz),wz);uv.push(x/n,z/n);const v=.85+.1*Math.sin(wx*.022+wz*.016);cs.push(v,v,v,1);}
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const a=z*(n+1)+x;idx.push(a,a+n+1,a+1,a+1,a+n+1,a+n+2);}meshEntity(app,root,'Continuous canyon floor',p,idx,uv,sand,cs);
 function ridge(x:number,z:number,w:number,h:number,d:number,seed:number){const rand=seeded(seed),pos:number[]=[],uvs:number[]=[],indices:number[]=[],shades:number[]=[];const rings=18,sides=20;const phases=Array.from({length:sides},()=>rand()*.23);
  for(let r=0;r<=rings;r++)for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,t=r/rings;const profile=Math.pow(1-t,.38)*(1+Math.sin(t*35+seed)*.045)+.035;const radial=profile*(1+phases[j%sides]+Math.sin(a*3+t*2)*.07);pos.push(x+Math.cos(a)*w*radial+Math.sin(t*3)*w*.13,height(x,z)+t*h-1,z+Math.sin(a)*d*radial);uvs.push(j/sides*2,t);const v=.72+.22*Math.pow(t,.6)+Math.sin(t*46)*.045;shades.push(v,v,v,1);}
  for(let r=0;r<rings;r++)for(let j=0;j<sides;j++){const a=r*(sides+1)+j;indices.push(a,a+sides+1,a+1,a+1,a+sides+1,a+sides+2);}return meshEntity(app,root,'Layered canyon ridge',pos,indices,uvs,rock,shades);
 }
 // The flight corridor stays clear. Foreground frames the view; distances recede.
 [[-58,29,25,49,51],[65,0,28,55,46],[-71,-75,37,62,58],[78,-106,34,55,60],[-95,-184,44,66,67],[92,-229,52,74,58],[-100,-330,94,58,50],[91,-355,89,48,56]].forEach((a,i)=>ridge(...a as [number,number,number,number,number],11+i));
 ridge(27,-106,4,28,4.2,41);ridge(35,-111,3,18,3,47);
 const rand=seeded(129);for(let i=0;i<140;i++){const x=(rand()-.5)*200,z=70-rand()*320;if(Math.abs(x)<19&&z> -85)continue;const s=.3+rand()*1.7;const r=primitive(root,'Basalt fragment','sphere',[x,height(x,z)+s*.25,z],[s*1.4,s*.65,s],rock,[rand()*40,rand()*360,rand()*40]);r.render!.castShadows=i<80;}
 const trackMat=material(moon?0x434e5d:0x684935,0,.02);
 for(let k=0;k<75;k++)for(const side of [-1,1]){const z=12-k*1.6,x=3+Math.sin(k*.043)*7+side*.55;primitive(root,'Pressed wheel track','box',[x,height(x,z)+.03,z],[.32,.025,.46],trackMat,[0,-Math.cos(k*.043)*12,0]);}
 return root;
}

// Smooth collision envelope follows the major authored ridges and spires.
export function clearPosition(x:number,z:number,altitude:number){
 let hit=false;
 const ridges=[[-58,29,25,49,51],[65,0,28,55,46],[-71,-75,37,62,58],[78,-106,34,55,60],[-95,-184,44,66,67],[92,-229,52,74,58],[27,-106,4,28,4.2],[35,-111,3,18,3]];
 for(const [cx,cz,w,h,d] of ridges){if(altitude>h+3)continue;const f=Math.pow(Math.max(.05,1-altitude/h),.38),rx=w*f+2,rz=d*f+2,dx=(x-cx)/rx,dz=(z-cz)/rz,n=Math.hypot(dx,dz);if(n<1){x=cx+(n?dx/n:1)*rx;z=cz+(n?dz/n:0)*rz;hit=true;}}
 return {x,z,hit};
}
