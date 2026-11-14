export type Chapter='mars'|'moon';
export type Stage='flight'|'approach'|'descent'|'landed'|'exit'|'walk'|'recovery'|'assembly'|'complete';
export type Contact={id:string;name:string;x:number;z:number;mount:string;angle:number;clue:string;samples:{x:number;z:number;radius?:number}[];radius:number;locked:boolean;recovered:boolean;fitted:boolean};
export type Expedition={version:2;chapter:Chapter;stage:Stage;x:number;z:number;altitude:number;heading:number;contacts:Contact[];history:string[];playerX:number;playerZ:number};
export const landing={x:0,z:-83};
export const saveKey=(chapter:Chapter)=>`signal-pc-odyssey-v2-${chapter}`;
export function fresh(chapter:Chapter):Expedition {
 const moon=chapter==='moon';
 return {version:2,chapter,stage:'flight',x:0,z:74,altitude:24,heading:0,playerX:0,playerZ:-78,history:[],contacts:[
  {id:'camera',name:moon?'Navigation camera':'Camera mast',x:15,z:-102,mount:'mast',angle:0,clue:'Raise the optics above the chassis. Point the lenses toward the front rail.'},
  {id:'solar',name:moon?'Equipment rack':'Solar deck',x:-14,z:-119,mount:'deck',angle:90,clue:'This broad assembly belongs across the upper deck. Align its long edge with the amber rail.'},
  {id:'wheel',name:'Wheel assembly',x:21,z:-135,mount:'axle',angle:180,clue:'Fit the wheel to the right axle, with the hub facing outward.'},
 ].map(p=>({...p,samples:[],radius:36,locked:false,recovered:false,fitted:false}))};
}
export function load(chapter:Chapter):Expedition {
 const clean=fresh(chapter);
 try{const v=JSON.parse(localStorage.getItem(saveKey(chapter))||'null');if(!v||v.version!==2||v.chapter!==chapter)return clean;
  if(!['flight','approach','descent','landed','exit','walk','recovery','assembly','complete'].includes(v.stage))return clean;
  for(const k of ['x','z','altitude','heading','playerX','playerZ'] as const)if(Number.isFinite(v[k]))clean[k]=v[k];
  clean.stage=['descent','exit'].includes(v.stage)?'approach':v.stage==='recovery'?'walk':v.stage;
  clean.history=Array.isArray(v.history)?v.history.filter((s:unknown)=>typeof s==='string').slice(-30):[];
  for(const c of clean.contacts){const old=v.contacts?.find((p:Contact)=>p.id===c.id);if(!old)continue;c.samples=Array.isArray(old.samples)?old.samples.filter((p:{x:number;z:number})=>Number.isFinite(p.x)&&Number.isFinite(p.z)).slice(-16):[];c.radius=Number.isFinite(old.radius)?Math.max(1.1,old.radius):36;c.locked=old.locked===true;c.recovered=c.locked&&old.recovered===true;c.fitted=c.recovered&&old.fitted===true;}
 }catch{/* A damaged save starts a new expedition. */}return clean;
}
export function persist(s:Expedition){try{localStorage.setItem(saveKey(s.chapter),JSON.stringify(s));}catch{/* Session remains playable. */}}
export function scan(s:Expedition,c:Contact):'rough'|'refined'|'same' {
 if(c.samples.some(p=>Math.hypot(p.x-s.x,p.z-s.z)<12))return 'same';
 c.samples.push({x:s.x,z:s.z});let baseline=0,angle=0;
 for(const a of c.samples)for(const b of c.samples){baseline=Math.max(baseline,Math.hypot(a.x-b.x,a.z-b.z));const d=Math.atan2(c.x-a.x,c.z-a.z)-Math.atan2(c.x-b.x,c.z-b.z);angle=Math.max(angle,Math.abs(Math.atan2(Math.sin(d),Math.cos(d))));}
 c.radius=Math.max(1.1,31/(1+baseline/10+angle*14+(c.samples.length-1)*1.5));
 c.samples[c.samples.length-1].radius=c.radius;
 persist(s);return c.samples.length===1?'rough':'refined';
}
export const lockable=(c:Contact)=>c.samples.length>=2&&c.radius<=5;
export function award(chapter:Chapter){try{const key='signal-pc-collection-v1',ids=JSON.parse(localStorage.getItem(key)||'[]');localStorage.setItem(key,JSON.stringify([...new Set([...ids,chapter==='moon'?'lunar':'opportunity'])]));if(chapter==='mars')localStorage.setItem('omnecarta-collection-v1',JSON.stringify(['opportunity']));}catch{}}
export function hasLunar(){try{return JSON.parse(localStorage.getItem('signal-pc-collection-v1')||'[]').includes('lunar');}catch{return false;}}
