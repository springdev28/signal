import { missionSite, type PartId } from './mission';

export type Fix = { x:number; z:number; uncertainty:number; locked:boolean };
export type FlightPhase = 'briefing'|'survey'|'approach'|'landing'|'landed'|'exit'|'surface';
export type FlightSave = {
  version:1; phase:FlightPhase; x:number; z:number; altitude:number; heading:number;
  samples:{id:PartId;x:number;z:number}[]; contacts:Record<PartId,Fix>; history:string[];
};
const key='signal-flight-v1';
export const landingSite={x:-13,z:13};
export const recoveredLogs:Record<PartId,{packet:string;clue:string;area:[number,number]}>={
  camera:{packet:'OPTICS / last recovered frame',clue:'The paired stone needles are behind the mast. Wheel tracks run south below it. Search north of the tracks for the camera carrier.',area:[4,-13]},
  solar:{packet:'POWER / interrupted downlink',clue:'The deck tore free east of the mast. A wide reflection crossed the outer rim before the power return faded. Investigate the eastern shelf.',area:[19,-8]},
  wheel:{packet:'DRIVE / final odometry',clue:'The drive return stopped south of the mast, where the tracks bend toward the crater rim. Look for a low contact above the bend.',area:[7,0]},
};
export function newFlight():FlightSave{
  return {version:1,phase:'briefing',x:-14,z:30,altitude:42,heading:0,samples:[],history:[],
    contacts:Object.fromEntries(missionSite.parts.map(part=>[part.id,{x:recoveredLogs[part.id].area[0],z:recoveredLogs[part.id].area[1],uncertainty:28,locked:false}])) as Record<PartId,Fix>};
}
export function saveFlight(value:FlightSave){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Flight remains playable in this tab. */}}
export function loadFlight():FlightSave{
  const clean=newFlight();
  try{
    const value=JSON.parse(localStorage.getItem(key)??'null');
    if(!value||value.version!==1||!['briefing','survey','approach','landing','landed','exit','surface'].includes(value.phase))return clean;
    for(const field of ['x','z','altitude','heading'])if(!Number.isFinite(value[field]))return clean;
    clean.phase=['landing','exit'].includes(value.phase)?'approach':value.phase;
    clean.x=Math.max(-65,Math.min(65,value.x));clean.z=Math.max(-65,Math.min(65,value.z));
    clean.altitude=['landed','surface'].includes(clean.phase)?0:Math.max(18,Math.min(80,value.altitude));clean.heading=value.heading;
    clean.samples=Array.isArray(value.samples)?value.samples.filter((p:{id:PartId;x:number;z:number})=>Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.id in recoveredLogs).slice(-36):[];
    for(const part of missionSite.parts){const c=value.contacts?.[part.id];if(c&&Number.isFinite(c.x)&&Number.isFinite(c.z)&&Number.isFinite(c.uncertainty))clean.contacts[part.id]={x:c.x,z:c.z,uncertainty:Math.max(.8,c.uncertainty),locked:c.locked===true};}
    clean.history=Array.isArray(value.history)?value.history.filter((s:unknown)=>typeof s==='string').slice(-24):[];
  }catch{/* A corrupt save starts a new survey. */}
  return clean;
}
export function resetFlight(){saveFlight(newFlight());}
/** Geometry-driven teaching model: spatial baselines and bearing diversity constrain each contact. */
export function scanContacts(state:FlightSave,id:PartId){
  if(state.samples.some(p=>p.id===id&&Math.hypot(p.x-state.x,p.z-state.z)<8))return false;
  state.samples.push({id,x:state.x,z:state.z});state.samples=state.samples.slice(-36);
  const samples=state.samples.filter(p=>p.id===id);
  for(const [index,part] of missionSite.parts.entries()){
    if(part.id!==id||state.contacts[part.id].locked)continue;
    let baseline=0,spread=0;
    for(const a of samples)for(const b of samples){
      baseline=Math.max(baseline,Math.hypot(a.x-b.x,a.z-b.z));
      const da=Math.atan2(part.position[0]-a.x,a.z-part.position[1]),db=Math.atan2(part.position[0]-b.x,b.z-part.position[1]);
      spread=Math.max(spread,Math.abs(Math.atan2(Math.sin(da-db),Math.cos(da-db)))*180/Math.PI);
    }
    const range=Math.hypot(part.position[0]-state.x,part.position[1]-state.z);
    const radius=Math.max(.9,20*(1+range/120)/(1+baseline/12+spread/35+samples.length*.3));
    const uncertainty=Math.min(state.contacts[part.id].uncertainty,radius);
    state.contacts[part.id]={x:part.position[0]+Math.sin(index*2.4+1)*uncertainty*.25,z:part.position[1]+Math.cos(index*1.7+1)*uncertainty*.25,uncertainty,locked:false};
  }
  return true;
}
export const canLock=(state:FlightSave,id:PartId)=>state.samples.filter(p=>p.id===id).length>=3&&state.contacts[id].uncertainty<=5;
