import { icon } from './ui';
import { asset } from './catalog';
import { missionSite, partById, saveStory, startStory, type PartId } from './mission';
import { canLock, landingSite, loadFlight, recoveredLogs, saveFlight, scanContacts } from './flight-state';
import { createFlightScene } from './flight-scene';
import type { SolarisContext } from './solaris';

export function flightMarkup(){
  return `<section id="flight" class="flight-interface" aria-label="Odyssey cockpit">
    <div id="flight-stage" class="simulation-canvas"><img class="flight-fallback-art" src="${asset('ship-fallback.svg')}" alt="Illustration of the expedition ship with paired engines, swept wings, glass cockpit and landing struts"><p class="view-state" role="status">Powering the cockpit…</p></div>
    <header class="flight-heading"><p class="eyebrow">Odyssey · Fictional recovery mission</p><h1>The last downlink</h1><p id="flight-objective">Read the recovered data. Locate three part beacons.</p></header>
    <section class="flight-brief hud-panel" id="flight-brief"><p class="eyebrow">Solaris</p><h2>We have a fragment.</h2><p>The rover’s last downlink survived. Its parts did not stay together.</p><p>Read each recovered record. Use its landmarks to choose a search region, then compare radar scans from different positions. I’ll turn those bearings into a landing plan.</p><button class="button primary" id="start-survey">Take the controls ${icon('arrow',17)}</button></section>
    <details class="flight-records hud-panel" id="flight-records" open><summary>Recovered data <span id="lock-count">0 / 3 locked</span></summary>
      <p class="record-disclaimer">Damaged spacecraft logs · fictional mission evidence</p>
      <div class="record-tabs" role="group" aria-label="Investigate a recovered record">${missionSite.parts.map((p,i)=>`<button class="record-tab" data-contact="${p.id}" aria-pressed="${i===0}">${p.id==='camera'?'Optics':p.id==='solar'?'Power':'Drive'}</button>`).join('')}</div>
      <p class="eyebrow" id="packet-name"></p><p id="packet-clue"></p>
      <label class="clue-hypothesis">Interpret the landmark clue<select id="search-region"><option value="">Choose a search region</option><option value="camera">North of the tracks</option><option value="solar">Eastern shelf</option><option value="wheel">Above the track bend</option></select></label>
      <div class="contact-reading"><strong id="contact-name"></strong><output id="contact-confidence"></output><p id="contact-evidence"></p></div>
      <button class="button primary" id="lock-contact" disabled>Lock camera location</button>
      <button class="button primary" id="begin-approach" hidden>Begin landing approach</button>
    </details>
    <div class="flight-instruments" id="flight-instruments">
      <section class="flight-radar hud-panel"><h2>Survey radar <span id="radar-range">80 m</span></h2><canvas id="flight-radar" width="420" height="420" role="img" aria-label="Radar: read a recovered record to select a search region."></canvas><p id="radar-caption">Ring: search uncertainty · S: spires · T: tracks</p></section>
      <section class="flight-pilot hud-panel"><div class="flight-readings"><span>Heading <output id="flight-heading-value">000°</output></span><span>Altitude <output id="flight-altitude">42 m</output></span><span>Speed <output id="flight-speed">0 m/s</output></span></div>
        <label for="flight-throttle">Throttle <output id="throttle-value">0%</output></label><input id="flight-throttle" type="range" min="0" max="100" step="5" value="0">
        <div class="flight-actions"><div class="flight-steering" aria-label="Flight steering"><button data-steer="left" aria-label="Bank left">${icon('back',18)}</button><button data-steer="up" aria-label="Pitch up">${icon('up',18)}</button><button data-steer="down" aria-label="Pitch down">${icon('lower',18)}</button><button data-steer="right" aria-label="Bank right">${icon('arrow',18)}</button></div><button class="button primary" id="flight-scan">${icon('scan',18)} Scan</button><button class="button" id="flight-brake">Brake</button></div>
        <p>WASD / arrows steer · Q / E throttle · Space scans · B brakes</p><button id="flight-camera" class="flight-camera">Exterior view</button></section>
    </div>
    <section id="approach-panel" class="flight-approach hud-panel" hidden><h2>Landing approach</h2><p id="approach-reading"></p><p>Your three locks are carried on the radar. Land in the clear area west of the wreck.</p><div class="mission-actions"><button class="button" id="guide-landing">Guide to landing zone</button><button class="button primary" id="land-ship" disabled>Land</button></div></section>
    <section id="landing-input" class="flight-landing hud-panel" hidden><p class="eyebrow">Solaris</p><h2 id="landing-title">Crosswind at the rim.</h2><p id="landing-status" role="status"></p><div class="mission-actions"><button class="button primary" id="stabilize-descent">Stabilize descent</button><button class="button" id="retry-descent" hidden>Retry approach</button><button class="button" id="untimed-descent">Use untimed input</button><button class="button primary" id="step-outside" hidden>Step outside as Astra</button></div></section>
    <div class="flight-dialogue hud-panel" role="status"><span>Solaris</span><p id="flight-line">The last downlink is on your right. Start with the optics record.</p></div>
  </section>`;
}

export function mountFlight(solaris:SolarisContext,complete:()=>void){
  const root=document.querySelector<HTMLElement>('#flight')!,$=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
  const state=loadFlight(),events=new AbortController(),keys=new Set<string>(),pointers=new Map<number,string>();
  let selected:PartId='camera',throttle=0,time=0,last=0,animation=0,scanTime=-100,lastUi=0,lastSave=0;
  const hypotheses:Record<PartId,string>={camera:'',solar:'',wheel:''};
  let paused=false,guide=false,landingT=0,descentT=0,landingStart=20,confirmed=false,missed=false,untimed=matchMedia('(prefers-reduced-motion: reduce)').matches,hatch=0,exit=0,touchdown=0,finished=false;
  const radar=$<HTMLCanvasElement>('flight-radar'),ctx=radar.getContext('2d')!;
  let scene:ReturnType<typeof createFlightScene>|undefined;
  try{scene=createFlightScene($('flight-stage'),radar);$('flight-stage').querySelector('.view-state')!.remove();$('flight-stage').classList.add('view-ready');}
  catch{$('flight-stage').classList.add('flight-fallback');$('flight-stage').querySelector('.view-state')!.textContent='3D unavailable. The radar and flight controls remain active.';}
  $('flight-camera').addEventListener('click',()=>{if(scene)$('flight-camera').textContent=scene.toggleCamera()?'Cockpit view':'Exterior view';});
  if(matchMedia('(max-width:620px)').matches)($('flight-records') as HTMLDetailsElement).open=false;
  function say(line:string){$('flight-line').textContent=line;state.history.push(line);state.history=state.history.slice(-24);saveFlight(state);}
  function changeThrottle(value:number){throttle=Math.max(0,Math.min(1,value));$('flight-throttle').setAttribute('aria-valuetext',Math.round(throttle*100)+' percent');($('flight-throttle') as HTMLInputElement).value=String(Math.round(throttle*100));}
  function scan(){
    if(state.phase!=='survey'||time-scanTime<.75)return;
    if(!hypotheses[selected]){say('Read the recovered record, then choose which landmark region to investigate.');return;}
    if(hypotheses[selected]!==selected){say('That region does not agree with the last recovered data. Compare the landmark direction in the record and choose another region.');return;}
    if(state.contacts[selected].locked){say('That location is already locked. Select the next recovered record.');return;}
    const range=Math.hypot(state.x-recoveredLogs[selected].area[0],state.z-recoveredLogs[selected].area[1]);
    if(range>80){say('The record points to the marked search region. Fly closer before scanning.');return;}
    scanTime=time;
    if(!scanContacts(state,selected)){say('This repeats the same bearing. Move at least 8 m before comparing another scan.');return;}
    if(canLock(state,selected))say('The bearings agree with the recovered record. You can lock this part’s location.');
    else say(`${partById(selected)!.name}: uncertainty ±${state.contacts[selected].uncertainty.toFixed(1)} m. Change position and view it from another angle.`);
    renderUi();
  }
  function select(id:PartId){selected=id;renderUi();say(recoveredLogs[id].clue);}
  $('search-region').addEventListener('change',()=>{hypotheses[selected]=$<HTMLSelectElement>('search-region').value;say('Search region selected. Fly to compare its return with the recovered record.');});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-contact]'))button.addEventListener('click',()=>select(button.dataset.contact as PartId));
  $('start-survey').addEventListener('click',()=>{state.phase='survey';say('Optics says north of the tracks. Set your throttle, steer toward that region, and compare three separated scan positions.');renderUi();$('flight-stage').querySelector('canvas')?.focus();});
  $('flight-scan').addEventListener('click',scan);
  $('flight-throttle').addEventListener('input',()=>{guide=false;changeThrottle(Number(($('flight-throttle') as HTMLInputElement).value)/100);});
  $('flight-brake').addEventListener('click',()=>{guide=false;changeThrottle(0);});
  $('lock-contact').addEventListener('click',()=>{
    if(!canLock(state,selected)||state.contacts[selected].locked)return;
    state.contacts[selected].locked=true;
    say(`${partById(selected)!.name} locked. That fix will stay with us through the landing and on foot.`);renderUi();
  });
  $('begin-approach').addEventListener('click',()=>{state.phase='approach';changeThrottle(0);($('flight-records') as HTMLDetailsElement).open=false;say('Three parts, three fixes. Bring us over the clear landing zone west of the wreck.');renderUi();});
  $('guide-landing').addEventListener('click',()=>{guide=true;say('I have the approach vector. You can override it with the steering controls.');});
  $('land-ship').addEventListener('click',()=>{
    if(state.phase!=='approach'||Math.hypot(state.x-landingSite.x,state.z-landingSite.z)>8||throttle>.3||state.altitude>32)return;
    guide=false;changeThrottle(0);state.phase='landing';landingT=descentT=0;confirmed=missed=false;landingStart=state.altitude;
    say('Lowering the landing gear. Stay on the stabilizer as we cross the rim.');renderUi();
  });
  $('stabilize-descent').addEventListener('click',()=>{if(state.phase==='landing'&&!missed&&landingT>=1.6){confirmed=true;say('Steady. Bring the landing struts onto the shelf.');}});
  $('retry-descent').addEventListener('click',()=>{missed=false;landingT=1.6;descentT=0;say('Approach reset. Stabilize when you’re ready.');});
  $('untimed-descent').addEventListener('click',()=>{untimed=true;missed=false;say('Holding a hover. Take your time and stabilize the descent.');});
  $('step-outside').addEventListener('click',()=>{if(state.phase==='landed'&&hatch>=1){state.phase='exit';exit=0;say('Hatch open. Your locked contacts are now surface waypoints. Follow them to the parts.');}});
  const mapping:Record<string,string>={a:'left',d:'right',w:'up',s:'down',arrowleft:'left',arrowright:'right',arrowup:'up',arrowdown:'down'};
  document.addEventListener('keydown',event=>{
    if(paused||(event.target as HTMLElement).closest('input,select,textarea')||!['survey','approach'].includes(state.phase))return;
    const key=event.key.toLowerCase();
    if(mapping[key]){event.preventDefault();guide=false;keys.add(mapping[key]);}
    if(key==='q'){event.preventDefault();guide=false;changeThrottle(throttle-.1);}
    if(key==='e'){event.preventDefault();guide=false;changeThrottle(throttle+.1);}
    if(key==='b'){event.preventDefault();guide=false;changeThrottle(0);}
    if(event.code==='Space'&&(event.target===document.body||event.target instanceof HTMLCanvasElement)){event.preventDefault();if(!event.repeat)scan();}
  },{signal:events.signal});
  document.addEventListener('keyup',e=>keys.delete(mapping[e.key.toLowerCase()]),{signal:events.signal});
  window.addEventListener('blur',()=>{keys.clear();pointers.clear();changeThrottle(0);},{signal:events.signal});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-steer]')){
    button.addEventListener('click',e=>{if(e.detail===0){guide=false;pointers.set(-1,button.dataset.steer!);setTimeout(()=>pointers.delete(-1),220);}});
    button.addEventListener('pointerdown',e=>{guide=false;button.setPointerCapture(e.pointerId);pointers.set(e.pointerId,button.dataset.steer!);e.preventDefault();});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,e=>pointers.delete((e as PointerEvent).pointerId));
  }
  solaris.pause=value=>{paused=value;keys.clear();pointers.clear();};
  solaris.hint=()=>state.phase==='briefing'?'Read Optics, Power and Drive in Recovered data. Choose a region from each landmark clue, then take the controls to compare radar bearings.':state.phase==='survey'?`${recoveredLogs[selected].clue} ${state.samples.filter(p=>p.id===selected).length<3?'Compare at least three scan positions, 8 m apart. A wider angle narrows the contact.':'Change your viewing angle until uncertainty is 5 m or less, then lock the location.'}`:state.phase==='approach'?'Approach the clear zone west of the wreck. Land within 8 m, below 32 m, with throttle at 30% or less. The guide can align the approach.':'I’m with you. Steady the descent, then step through the hatch when it opens.';
  solaris.history=()=>state.history;
  solaris.mission=()=>({phase:'flight-'+state.phase,observed:[...new Set(state.samples.map(p=>missionSite.parts.findIndex(part=>part.id===p.id)))],collected:[],fitted:[],attempts:0,hints:0,selection:selected,cutscene:state.phase==='landing',flight:{altitude:state.altitude,records:missionSite.parts.map(p=>({id:p.id,samples:state.samples.filter(s=>s.id===p.id).length,uncertainty:state.contacts[p.id].uncertainty,locked:state.contacts[p.id].locked}))}});
  function renderUi(){
    const locked=Object.values(state.contacts).filter(c=>c.locked).length,contact=state.contacts[selected],count=state.samples.filter(p=>p.id===selected).length;
    root.dataset.phase=state.phase;root.dataset.position=state.x.toFixed(2)+','+state.z.toFixed(2);root.dataset.heading=state.heading.toFixed(3);root.dataset.scans=String(state.samples.length);root.dataset.locks=String(locked);
    solaris.subject=`Odyssey · ${state.phase==='briefing'?'Cockpit briefing':state.phase==='survey'?recoveredLogs[selected].packet:state.phase==='approach'?'Landing approach':state.phase==='exit'?'Astra disembarking':'Touchdown'}`;solaris.selection=selected;
    $('flight-brief').hidden=state.phase!=='briefing';$('flight-instruments').hidden=!['survey','approach'].includes(state.phase);
    $('flight-records').hidden=!['briefing','survey','approach'].includes(state.phase);
    $('lock-count').textContent=locked+' / 3 locked';$('packet-name').textContent=recoveredLogs[selected].packet;$('packet-clue').textContent=recoveredLogs[selected].clue;
    $('contact-name').textContent=partById(selected)!.name;$('contact-confidence').textContent=contact.locked?'Location locked':count?'Uncertainty ±'+contact.uncertainty.toFixed(1)+' m':'Search region from recovered data';
    $('contact-evidence').textContent=count?`${count} distinct bearings${contact.locked?' · retained for surface navigation':''}`:'No scan evidence yet.';
    $<HTMLButtonElement>('flight-scan').disabled=time-scanTime<.75||state.phase!=='survey';
    $('flight-scan').setAttribute('aria-label',time-scanTime<.75?'Scanner recharging':'Scan');
    $<HTMLSelectElement>('search-region').value=hypotheses[selected];
    const lock=$<HTMLButtonElement>('lock-contact');lock.disabled=!canLock(state,selected)||contact.locked;lock.textContent=contact.locked?'Location locked':'Lock '+selected+' location';
    for(const button of root.querySelectorAll<HTMLButtonElement>('[data-contact]')){button.setAttribute('aria-pressed',String(button.dataset.contact===selected));button.classList.toggle('contact-locked',state.contacts[button.dataset.contact as PartId].locked);}
    $('begin-approach').hidden=locked!==3||state.phase!=='survey';
    $('throttle-value').textContent=Math.round(throttle*100)+'%';$('flight-altitude').textContent=state.altitude.toFixed(0)+' m';$('flight-speed').textContent=(throttle*12).toFixed(1)+' m/s';$('flight-heading-value').textContent=String(Math.round((state.heading*180/Math.PI+360)%360)).padStart(3,'0')+'°';
    $('flight-objective').textContent=state.phase==='survey'?'Use the last downlink to choose a search region. Compare bearings; lock each part.':state.phase==='approach'?'Carry the fixes into a safe landing.':'Read the recovered data. Locate three part beacons.';
    $('approach-panel').hidden=state.phase!=='approach';const range=Math.hypot(state.x-landingSite.x,state.z-landingSite.z);
    $('approach-reading').textContent=`Clear zone · ${range.toFixed(1)} m away · ${state.altitude.toFixed(0)} m altitude`;
    $<HTMLButtonElement>('land-ship').disabled=range>8||throttle>.3||state.altitude>32;
    $('landing-input').hidden=!['landing','landed','exit'].includes(state.phase);
    $('landing-title').textContent=state.phase==='landed'?'Landing struts secure.':state.phase==='exit'?'Your turn, Astra.':missed?'Hold the approach.':'Crosswind at the rim.';
    $('landing-status').textContent=state.phase==='landed'?(hatch<1?'Opening the hatch…':'Hatch open. All three fixes are ready.'):state.phase==='exit'?'Astra is stepping down to the surface.':confirmed?'Descent stabilized. Touchdown in progress.':missed?'The stabilizer window passed. Retry or choose untimed input.':landingT<1.6?'Crossing the crater rim…':untimed?'Holding a hover. Stabilize when you’re ready.':Math.max(0,Math.ceil(7.6-landingT))+' seconds to stabilize';
    $('stabilize-descent').hidden=state.phase!=='landing'||confirmed||missed||landingT<1.6;
    $('retry-descent').hidden=!missed;$('untimed-descent').hidden=state.phase!=='landing'||confirmed||untimed;
    $('step-outside').hidden=state.phase!=='landed';$<HTMLButtonElement>('step-outside').disabled=hatch<1;
  }
  function drawRadar(){
    const size=420,c=size/2,scale=2.35;ctx.clearRect(0,0,size,size);ctx.fillStyle='#081c26';ctx.fillRect(0,0,size,size);
    const point=(x:number,z:number)=>{const dx=x-state.x,dz=z-state.z,a=-state.heading;return [c+(dx*Math.cos(a)-dz*Math.sin(a))*scale,c+(dx*Math.sin(a)+dz*Math.cos(a))*scale];};
    ctx.strokeStyle='#315561';ctx.lineWidth=1;
    for(const r of [47,94,141,188]){ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(20,c);ctx.lineTo(400,c);ctx.moveTo(c,20);ctx.lineTo(c,400);ctx.stroke();
    ctx.save();ctx.beginPath();ctx.arc(c,c,190,0,Math.PI*2);ctx.clip();
    for(const [index,part] of missionSite.parts.entries()){
      let contact=state.contacts[part.id];if(part.id!==selected&&!contact.locked)continue;
      if(!contact.locked&&!hypotheses[selected])continue;
      if(!contact.locked&&hypotheses[selected]!==selected){const area=recoveredLogs[hypotheses[selected] as PartId].area;contact={x:area[0],z:area[1],uncertainty:28,locked:false};}
      const [x,y]=point(contact.x,contact.z),r=Math.max(5,contact.uncertainty*scale);
      ctx.strokeStyle=contact.locked?'#9be7df':'#e0b57c';ctx.fillStyle=contact.locked?'#72e1cf':'#dca86518';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=contact.locked?'#b9f4eb':'#e7c69b';ctx.font='bold 17px sans-serif';ctx.fillText(contact.locked?['C','P','W'][index]:'?',x-5,y+6);
    }
    missionSite.landmarks.forEach((mark,i)=>{const [x,y]=point(...mark.position);ctx.fillStyle='#91adba';ctx.font='16px sans-serif';ctx.fillText(i?'T':'S',x,y);});
    if(state.phase==='approach'){const [x,y]=point(landingSite.x,landingSite.z);ctx.strokeStyle='#c0f5f5';ctx.strokeRect(x-10,y-10,20,20);ctx.fillStyle='#c0f5f5';ctx.fillText('LAND',x+14,y+5);}
    if(time-scanTime<1.1){ctx.strokeStyle='#81dfed';ctx.beginPath();ctx.arc(c,c,(time-scanTime)*180,0,Math.PI*2);ctx.stroke();}
    ctx.restore();ctx.fillStyle='#d4f4f6';ctx.beginPath();ctx.moveTo(c,c-9);ctx.lineTo(c-7,c+7);ctx.lineTo(c+7,c+7);ctx.closePath();ctx.fill();
    ctx.font='13px sans-serif';ctx.fillStyle='#a4c3cf';ctx.fillText('SHIP ↑',c-23,403);
    radar.setAttribute('aria-label',`${partById(selected)!.name}. ${$('contact-confidence').textContent}. Ship at ${state.x.toFixed(0)} east, ${state.z.toFixed(0)} south. ${state.samples.filter(p=>p.id===selected).length} distinct scans.`);
  }
  function draw(now:number){
    const dt=paused||document.hidden?0:last?Math.min(.05,(now-last)/1000):0;last=now;time+=dt;
    const active=new Set([...keys,...pointers.values()]);let steer=Number(active.has('right'))-Number(active.has('left')),pitch=Number(active.has('up'))-Number(active.has('down'));
    if(['survey','approach'].includes(state.phase)){
      if(guide){
        const dx=landingSite.x-state.x,dz=landingSite.z-state.z,range=Math.hypot(dx,dz),goal=Math.atan2(dx,-dz);
        const error=Math.atan2(Math.sin(goal-state.heading),Math.cos(goal-state.heading));steer=Math.max(-1,Math.min(1,error*2));
        changeThrottle(Math.abs(error)>.6?0:range>12?.6:range>3?.22:0);state.altitude=Math.max(22,state.altitude-dt*6);
        if(range<3&&state.altitude<=23){guide=false;changeThrottle(0);say('On the clear zone. Throttle is idle. You can land.');}
      }
      state.heading+=steer*dt*.82;state.altitude=Math.max(18,Math.min(80,state.altitude+pitch*dt*8));
      state.x=Math.max(-65,Math.min(65,state.x+Math.sin(state.heading)*throttle*12*dt));state.z=Math.max(-65,Math.min(65,state.z-Math.cos(state.heading)*throttle*12*dt));
    }
    if(state.phase==='landing'){
      if(!missed)landingT+=dt;
      if(!confirmed){state.altitude=landingStart+(7-landingStart)*Math.min(1,landingT/1.6);if(!untimed&&landingT>=7.6)missed=true;}
      else{descentT+=dt;state.altitude=7*Math.max(0,1-descentT/3.2)**2;if(state.altitude===0){state.phase='landed';touchdown=0;say('Touchdown. Let the dust settle. Opening the hatch.');}}
    }
    if(state.phase==='landed'){touchdown+=dt;hatch=Math.min(1,Math.max(0,(touchdown-.65)/1.2));}
    if(state.phase==='exit'){exit=Math.min(1,exit+dt/2.6);touchdown+=dt;}
    if(time-lastUi>.08||!lastUi){renderUi();drawRadar();lastUi=time;}
    scene?.draw({state,throttle,steer,pitch,time,scan:time-scanTime,hatch,exit,touchdown});
    if(time-lastSave>1){saveFlight(state);lastSave=time;}
    if(exit===1&&!finished){
      finished=true;state.phase='surface';saveFlight(state);
      const save=startStory(),point=scene?.exitPosition()??landingSite;save.phase='recover';save.x=Math.max(-18,Math.min(18,point.x));save.z=Math.max(-18,Math.min(18,point.z));save.observed=[0,1];save.history=[...state.history,'Three fixes from the last downlink. Follow a locked waypoint and recover its part.'];saveStory(save);
      events.abort();scene?.dispose();root.remove();complete();return;
    }
    animation=requestAnimationFrame(draw);
  }
  renderUi();drawRadar();draw(performance.now());
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(animation);saveFlight(state);events.abort();scene?.dispose();},{once:true});
}
