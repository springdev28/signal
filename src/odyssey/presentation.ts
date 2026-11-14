import * as pc from 'playcanvas';
import {asset} from '../catalog';
import {color,material,meshEntity,texture} from './world';
export function sky(app:pc.AppBase,moon:boolean){
 const p:number[]=[],uv:number[]=[],idx:number[]=[],colors:number[]=[];const rings=24,sides=48;
 for(let r=0;r<=rings;r++)for(let s=0;s<=sides;s++){const y=Math.cos(r/rings*Math.PI),a=s/sides*Math.PI*2,t=Math.sin(r/rings*Math.PI);p.push(Math.sin(a)*t*720,y*720,Math.cos(a)*t*720);uv.push(s/sides,r/rings);const k=Math.pow(Math.max(0,y),.45),h=color(moon?0x0b101b:0xa98e7e),top=color(moon?0x01040a:0x243c54);h.lerp(h,top,k);colors.push(h.r,h.g,h.b,1);}
 for(let r=0;r<rings;r++)for(let s=0;s<sides;s++){const i=r*(sides+1)+s;idx.push(i,i+1,i+sides+1,i+1,i+sides+2,i+sides+1);}
 const m=material(0);m.useLighting=false;m.useFog=false;m.emissive.set(1,1,1);m.emissiveVertexColor=true;m.emissiveIntensity=.35;m.cull=pc.CULLFACE_NONE;m.depthWrite=false;m.update();const e=meshEntity(app,app.root,'Painted horizon',p,idx,uv,m,colors);e.render!.castShadows=false;return e;
}
export async function paintCraft(app:pc.AppBase,entity:pc.Entity){const t=await texture(app,asset('painted-surface.jpg'));for(const node of entity.find(n=>!!(n as pc.Entity).render) as pc.Entity[])for(const mesh of node.render!.meshInstances){const m=mesh.material as pc.StandardMaterial;if(!m.diffuseMap){m.diffuseMap=t;m.diffuseMapTiling.set(2,2);}m.metalness=Math.min(.35,m.metalness);m.update();}}
export function expressiveEyes(app:pc.AppBase,astra:pc.Entity){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const g=canvas.getContext('2d')!;const tex=new pc.Texture(app.graphicsDevice,{width:128,height:128,mipmaps:false});tex.setSource(canvas);
 const m=material(0x000000);m.useLighting=false;m.emissiveMap=tex;m.emissive.set(1,1,1);m.emissiveIntensity=1.7;m.update();
 for(const name of ['Left digital display','Right digital display']){const n=astra.findByName(name) as pc.Entity|null;if(n?.render)for(const mesh of n.render.meshInstances)mesh.material=m;}
 let last=0;return(time:number,motion:string)=>{if(time-last<.04)return;last=time;g.fillStyle='#020c13';g.fillRect(0,0,128,128);const blink=Math.sin(time*1.13)>.993?.06:1,open=motion==='Recover'?.6:1,x=64+Math.sin(time*.65)*8,y=62+(motion==='Talk'?Math.sin(time*7)*2:0);g.fillStyle='#61dad8';g.shadowColor='#9bffec';g.shadowBlur=7;g.beginPath();g.roundRect(x-26,y-31*blink*open,52,62*blink*open,7);g.fill();g.shadowBlur=0;g.fillStyle='#061b23';g.fillRect(x-10,y-22*blink*open,20,44*blink*open);g.fillStyle='#00101844';for(let j=0;j<128;j+=4)g.fillRect(0,j,128,1);tex.upload();};
}
