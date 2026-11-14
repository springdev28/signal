import { rover } from './catalog';

export type Point = readonly [x: number, z: number];
export const missionSite = {
  name: 'Perseverance Valley',
  start: [-13, 13] as Point,
  wreck: [10, -10] as Point,
  landmarks: [
    { name: 'Twin spires', position: [-8, -4] as Point, clue: 'From the twin spires the signal points across the valley toward the northeast.' },
    { name: 'Wheel tracks', position: [5, 4] as Point, clue: 'The tracks bend north along the rim. Follow them toward the stronger signal.' },
  ],
  parts: [
    { id: 'camera', name: 'Camera assembly', position: [6, -12], mount: 'mast', angle: 0, contact: [0, 1.137, -.605], clue: 'Mount it above the deck. Point the lenses toward the front marker.' },
    { id: 'solar', name: 'Solar panel', position: [14, -8], mount: 'deck', angle: 90, contact: [0, 1.126, 0], clue: 'Seat it across the deck. Match its long edge to the yellow deck rail.' },
    { id: 'wheel', name: 'Wheel assembly', position: [9, -5], mount: 'axle', angle: 180, contact: [.797, .214, .175], clue: 'Attach it on the right side. Face the hub outward.' },
  ],
  mounts: [
    {id:'mast', name:'Mast', direction:'front', angle:0},
    {id:'deck', name:'Deck', direction:'right', angle:90},
    {id:'axle', name:'Right axle', direction:'rear', angle:180},
  ],
  reach: 2.45,
  tolerance: 15,
} as const;

export type Part = typeof missionSite.parts[number];
export type PartId = Part['id'];
export type MountId = Part['mount'];
export type Phase = 'briefing' | 'search' | 'locate' | 'recover' | 'assemble' | 'complete';
type Sample = { distance:number; strength:number };
export type StorySave = {
  version:1;
  phase:Phase;
  x:number;
  z:number;
  observed:number[];
  collected:PartId[];
  fitted:PartId[];
  samples:Sample[];
  history:string[];
  hints:number;
  attempts:number;
};
const saveKey = 'omnecarta-story-v1';
const collectionKey = 'omnecarta-collection-v1';
export const partById = (id: unknown) => missionSite.parts.find(part => part.id === id);
export const startStory = ():StorySave => ({
  version:1, phase:'briefing', x:missionSite.start[0], z:missionSite.start[1],
  observed:[], collected:[], fitted:[], samples:[], history:[], hints:0, attempts:0,
});

function read(key:string):unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); }
  catch { return null; }
}
function write(key:string,value:unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* Keep the current session playable when storage is disabled. */ }
}
function ids(input:unknown):PartId[] {
  return Array.isArray(input) ? [...new Set(input.filter(value => partById(value)))] as PartId[] : [];
}
const phases:Phase[] = ['briefing','search','locate','recover','assemble','complete'];

export function loadStory():StorySave {
  const value = read(saveKey) as Partial<StorySave> | null;
  const saved = startStory();
  if (!value || value.version !== 1 || !value.phase || !phases.includes(value.phase)) return saved;
  saved.phase = value.phase;
  saved.x = Number.isFinite(value.x) ? Math.max(-18, Math.min(18, value.x!)) : saved.x;
  saved.z = Number.isFinite(value.z) ? Math.max(-18, Math.min(18, value.z!)) : saved.z;
  saved.observed = Array.isArray(value.observed) ? [...new Set(value.observed.filter(i => i === 0 || i === 1))] : [];
  if (['recover','assemble','complete'].includes(saved.phase)) saved.collected = ids(value.collected);
  if (['assemble','complete'].includes(saved.phase)) {
    if (saved.collected.length !== missionSite.parts.length) saved.phase = 'recover';
    else saved.fitted = ids(value.fitted).filter(id => saved.collected.includes(id));
  }
  if (saved.phase === 'complete' && saved.fitted.length !== missionSite.parts.length) saved.phase = 'assemble';
  if (saved.phase === 'assemble' && saved.fitted.length === missionSite.parts.length) saved.phase = 'complete';
  if (saved.phase === 'recover' && saved.collected.length === missionSite.parts.length) saved.phase = 'assemble';
  if (saved.phase === 'locate' && saved.observed.length < 2) saved.phase = 'search';
  if (saved.phase === 'search' && saved.observed.length === 2) saved.phase = 'locate';
  saved.samples = Array.isArray(value.samples) ? value.samples.filter(s => s && Number.isFinite(s.distance) && s.distance >= 0 && s.distance <= 60 && Number.isFinite(s.strength) && s.strength >= 0 && s.strength <= 100).slice(-24) : [];
  saved.history = Array.isArray(value.history) ? value.history.filter(v => typeof v === 'string').map(v => v.slice(0,240)).slice(-30) : [];
  saved.hints = Number.isInteger(value.hints) && value.hints! >= 0 ? Math.min(30,value.hints!) : 0;
  saved.attempts = Number.isInteger(value.attempts) && value.attempts! >= 0 ? Math.min(30,value.attempts!) : 0;
  return saved;
}
let recoveredInSession = false;
export function collectionHasRover() {
  const record = read(collectionKey);
  return recoveredInSession || (Array.isArray(record) && record.includes(rover.id));
}
export function saveStory(state:StorySave) {
  write(saveKey,state);
  if (state.phase === 'complete') {
    recoveredInSession = true;
    write(collectionKey,[rover.id]);
  }
}
export function distance(x:number,z:number,point:Point) {
  return Math.hypot(point[0]-x,point[1]-z);
}
export function bearing(x:number,z:number,point:Point) {
  return (Math.round(Math.atan2(point[0]-x,z-point[1])*180/Math.PI)+360)%360;
}
export const signalStrength = (range:number) => Math.round(100/(1+(range/10)**2));
export const angleDistance = (a:number,b:number) => Math.abs((a-b+540)%360-180);
