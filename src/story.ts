import type { SolarisContext } from './solaris';
import { drawerMarkup, icon, mountDrawer, routeLink } from './ui';
import { loadOpportunity } from './hardware';
import { angleDistance, bearing, collectionHasRover, distance, loadStory, missionSite, partById, saveStory, signalStrength, startStory, type PartId, type Phase, type Point } from './mission';
import { loadFlight, recoveredLogs } from './flight-state';
import { createStoryScene } from './story-scene';
import { chartSurface } from './chart';
import { link } from './catalog';
import { createGroundMotion, movementKeys, relativeMovement, type GroundDirection } from './locomotion';

const initialClues = [
  'An old beacon is broadcasting near the crater rim.',
  'Take a scanner reading at the twin spires and compare the bearing from the wheel tracks.',
  'Follow the tracks north. A rising signal means you are getting closer.',
];
const objectives:Record<Phase,string> = {
  briefing:'Locate the rover, recover three parts, and rebuild it.',
  search:'Scan at the twin spires and the wheel tracks.',
  locate:'Follow the signal. Scan within reach to reveal the wreck.',
  recover:'Recover the locked parts.',
  assemble:'Reassemble Opportunity.',
  complete:'Opportunity is in My Collection.',
};

export function storyMarkup() {
  return `<article class="shell story"><header class="story-heading">
    <div><h1>Odyssey</h1><p>Opportunity recovery · ${missionSite.name} · Fictional mission</p></div>
    ${routeLink('opportunity', 'Mission record', 'quiet-link', true)}
  </header>
  <div class="mission-layout" id="mission-layout">
    <aside class="mission-panel mission-brief">
      <div class="mission-objective"><h2>Objective</h2><p id="objective"></p><span id="progress" class="coordinates"></span></div>
      <div id="briefing" hidden>
        <ol>${initialClues.map(clue => `<li>${clue}</li>`).join('')}</ol>
        <button class="button primary" id="start-mission">Start mission</button>
      </div>
      <ol class="active-clues" id="active-clues" aria-label="Recent clues" hidden></ol>
      <div class="mission-actions"><button class="button outline" id="clues-button">Clues</button>
        <button class="button outline" id="story-help" aria-controls="control-notes" aria-expanded="false">Controls</button>
        <button class="button outline scanner-toggle" type="button" id="scanner-toggle" aria-controls="detail-drawer" aria-expanded="false">Map &amp; scanner</button></div>
      <p id="control-notes" hidden>WASD and arrows move relative to your camera. Drag to look, scroll or pinch to zoom. E scans or inspects the nearest part.</p>
    </aside>
    <div class="mission-main">
      <section class="mission-view" aria-label="Mission view">
        <div id="mission-stage">
          <p id="scene-status" role="status">Loading 3D scene…</p><div id="surface-waypoint-hud" class="surface-waypoint-hud" hidden></div>
        </div>
        <details class="scene-toolbar"><summary>${icon('sliders',16)} Camera</summary>
        <div class="scene-controls" aria-label="Camera controls">
          <button data-camera="left" aria-label="Orbit left" title="Orbit left">${icon('left',18)}</button>
          <button data-camera="right" aria-label="Orbit right" title="Orbit right">${icon('right',18)}</button>
          <button data-camera="in" aria-label="Zoom in" title="Zoom in">${icon('plus',18)}</button>
          <button data-camera="out" aria-label="Zoom out" title="Zoom out">${icon('minus',18)}</button>
          <button data-camera="reset" aria-label="Reset view" title="Reset view">${icon('reset',18)}</button>
        </div>
        </details>
        <div class="scene-caption" role="status"><span>Solaris</span><p id="scene-caption"></p></div>
      </section>
      <div id="field-controls" class="mission-panel field-controls" hidden>
        <div class="direction-pad" aria-label="Move Astra">
          <button data-move="forward" aria-label="Move forward">${icon('up',18)}</button>
          <button data-move="left" aria-label="Move left">${icon('back',18)}</button>
          <button data-move="backward" aria-label="Move backward">${icon('lower',18)}</button>
          <button data-move="right" aria-label="Move right">${icon('arrow',18)}</button>
        </div>
        <div class="field-actions"><div class="mission-actions">
          <button class="button primary" id="scan">${icon('scan',18)} Scan</button>
          <button class="button outline" id="interact" disabled>Inspect part</button></div>
          <p id="nearby"></p><p id="field-reading" role="status">Scan to take a reading.</p><p id="field-position"></p>
        </div>
      </div>
      <section id="mission-complete" class="mission-panel" hidden><h2>Opportunity reassembled</h2>
        <div class="mission-actions">${routeLink('collection','My Collection','button primary',true)}
        ${routeLink('opportunity','Open Exhibit','button outline')}
        <button id="replay" class="button outline">Replay Story</button></div>
      </section>
    </div>
    <aside class="mission-sidebar" id="mission-sidebar">
      <details id="navigation-tools" class="mission-panel"><summary>Map &amp; scanner</summary>
        <div id="minimap" class="minimap" role="img" aria-label="Map of the crater rim"><span class="map-north">N ↑</span>
          <span class="map-marker map-spires" title="Twin spires">S</span><span class="map-marker map-tracks" title="Wheel tracks">T</span>
          <span id="map-wreck" class="map-marker map-wreck" title="Wreck" hidden>W</span><span id="map-player" class="map-marker map-player" title="Astra">A</span>
        </div>
        <p class="map-legend">A Astra · S Twin spires · T Wheel tracks<span id="wreck-legend" hidden> · W Wreck</span></p>
        <p id="position"></p><p id="signal">Scan to take a reading.</p>
        <div id="recovery-waypoints" hidden><label>Locked waypoint<select id="surface-waypoint"></select></label><p id="waypoint-reading"></p><p id="waypoint-clue"></p></div>
        <figure class="signal-figure"><canvas id="signal-chart" width="360" height="175" role="img" aria-label="Signal strength by distance. No samples yet."></canvas>
          <figcaption>Signal (%) by distance (m). Dots mark scans. The ring follows Astra.</figcaption></figure>
      </details>
      <section id="workbench" class="mission-panel" hidden>
        <h2>Workbench</h2><p>Match each part to a mount. Rotate it before fitting, or drag it onto the mount.</p>
        <p id="assembly-clue" aria-live="polite">Select a recovered part to read its fitting clue.</p>
        <div id="assembly-controls"><div class="assembly-select">
          <label>Part <select id="assembly-part"><option value="">Select a part</option>${missionSite.parts.map(part=>`<option value="${part.id}">${part.name}</option>`).join('')}</select></label>
          <label>Mount <select id="assembly-mount"><option value="">Select a mount</option>${missionSite.mounts.map(mount=>`<option value="${mount.id}">${mount.name} · ${mount.direction} marker</option>`).join('')}</select></label>
        </div><div class="mission-actions"><button id="rotate-part" class="button outline">Rotate 45°</button><output id="part-angle" aria-live="polite">0°</output>
        <button class="button primary" id="fit-part">Fit Part</button></div></div>
        <p id="fit-feedback" role="status"></p>
      </section>
      <section class="mission-panel" id="inventory-panel">
        <h2>Inventory</h2><table aria-label="Inventory"><thead><tr><th scope="col">Part</th><th scope="col">State</th></tr></thead><tbody id="inventory"></tbody></table>
      </section>
    </aside>
  </div>
  ${drawerMarkup('Mission tools')}
  <dialog class="story-dialog" id="story-notes" aria-labelledby="notes-title">
    <div class="dialog-heading"><h2 id="notes-title">Clues</h2><span data-chat-slot></span><button class="close" data-close="story-notes" aria-label="Close clues">×</button></div>
    <ol id="clue-log"></ol></dialog>
  <dialog class="story-dialog cutscene-dialog" id="story-cutscene" aria-labelledby="cutscene-title">
    <div class="dialog-heading"><h2 id="cutscene-title">Stabilize the scanner</h2><span data-chat-slot></span></div>
    <p id="cutscene-copy"></p><p id="cutscene-time" class="coordinates"></p>
    <div class="mission-actions"><button class="button primary" id="stabilize">Stabilize</button>
      <button class="button outline" id="retry-cutscene" hidden>Retry</button><button class="button outline" id="untimed">Use untimed input</button></div>
  </dialog>
  <dialog class="story-dialog" id="part-dialog" aria-labelledby="pickup-title">
    <div class="dialog-heading"><h2 id="pickup-title">Inspect part</h2><span data-chat-slot></span><button class="close" data-close="part-dialog" aria-label="Close part inspection">×</button></div>
    <p id="pickup-clue"></p><button class="button primary" id="collect-part">Collect part</button></dialog>
  </article>`;
}

export function mountStory(solaris: SolarisContext) {
  const $ = <T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
  let state=loadStory();
  const flight=loadFlight(),hasFixes=Object.values(flight.contacts).every(c=>c.locked)&&flight.phase==='surface';
  let waypoint:PartId=missionSite.parts.find(p=>!state.collected.includes(p.id))?.id??'camera';
  if (new URLSearchParams(location.search).has('replay')) {
    state=startStory();
    saveStory(state);
    history.replaceState(null,'',location.pathname);
  }
  let selected:PartId|null=null, angle=0, inspection:PartId|null=null;
  let cutscene=false, cutMode:'timed'|'missed'|'untimed'='timed', timer=0, deadline=0;
  let lastSave=0, lastGraph=0, talkUntil=0,captionTimer=0;
  let pausedForChat = false, timeRemaining = 0, transitioning = false;
  const keys=new Set<GroundDirection>();
  const pointers=new Map<number,GroundDirection>();
  const motion=createGroundMotion(6.6);
  const nav=$('navigation-tools'), stage=$('mission-stage');
  const briefing=$('briefing'), field=$('field-controls'), workbench=$('workbench');
  const scanButton=$<HTMLButtonElement>('scan'), interact=$<HTMLButtonElement>('interact');
  const partSelect=$<HTMLSelectElement>('assembly-part'), mountSelect=$<HTMLSelectElement>('assembly-mount');
  const cutDialog=$<HTMLDialogElement>('story-cutscene'), partDialog=$<HTMLDialogElement>('part-dialog');
  const notes=$<HTMLDialogElement>('story-notes');
  const toolsDrawer=$<HTMLDialogElement>('detail-drawer');
  mountDrawer($('mission-sidebar'),toolsDrawer,$<HTMLButtonElement>('scanner-toggle'),false);
  toolsDrawer.addEventListener('toggle',()=>{if(toolsDrawer.open)(nav as HTMLDetailsElement).open=true;});
  const chart=$<HTMLCanvasElement>('signal-chart');
  const canWalk=()=>['search','locate','recover'].includes(state.phase)&&!transitioning&&!document.querySelector('dialog[open]');
  const sceneState=()=>({save:state,selection:selected,angle,cutscene,talkUntil,waypoint:state.phase==='recover'?(hasFixes?flight.contacts[waypoint]:{x:partById(waypoint)!.position[0],z:partById(waypoint)!.position[1],uncertainty:2,locked:true}):state.phase==='search'?{x:missionSite.landmarks[state.observed.includes(0)?1:0].position[0],z:missionSite.landmarks[state.observed.includes(0)?1:0].position[1],uncertainty:2,locked:true}:undefined,waypointLabel:state.phase==='recover'?partById(waypoint)!.name:missionSite.landmarks[state.observed.includes(0)?1:0].name});
  if(hasFixes){
    const select=$<HTMLSelectElement>('surface-waypoint');
    select.innerHTML=missionSite.parts.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    select.addEventListener('change',()=>{waypoint=select.value as PartId;render();});
    for(const [i,part] of missionSite.parts.entries()){
      const marker=document.createElement('span');marker.className='map-marker map-lock';marker.textContent=['C','P','D'][i];marker.title=part.name+' · locked in flight';marker.dataset.lock=part.id;
      $('minimap').append(marker);mapPoint(marker,[flight.contacts[part.id].x,flight.contacts[part.id].z]);
    }
  }
  let scene:ReturnType<typeof createStoryScene>|undefined;
  let lastFrame=0;
  function runFallback(now: number) {
    move(lastFrame ? Math.min(.05,(now-lastFrame)/1000) : 0);
    lastFrame=now;
    requestAnimationFrame(runFallback);
  }
  void loadOpportunity().then(hardware => {
    scene=createStoryScene(stage,{frame:move,pick:selectPart,mount:selectMountFromScene},hardware);
    $('scene-status').hidden=true;
    scene.update(sceneState());
  }).catch(() => {
    $('scene-status').textContent='3D unavailable. Continue with the map and mission controls.';
    stage.classList.add('scene-fallback');
    requestAnimationFrame(runFallback);
  });

  function say(line: string) {
    const duration=Math.max(3500,Math.min(8500,line.length*48));talkUntil=performance.now()+duration;
    clearTimeout(captionTimer);captionTimer=window.setTimeout(()=>{$('scene-caption').textContent='';},duration);
    state.history.push(line);
    state.history = state.history.slice(-30);
    $('scene-caption').textContent = line;
    const caption=$('scene-caption').parentElement!;
    caption.classList.remove('caption-enter');
    requestAnimationFrame(()=>caption.classList.add('caption-enter'));
  }
  function setPhase(phase:Phase) {
    state.phase=phase;
    state.hints=0;
    state.attempts=0;
  }
  function commit(){
    saveStory(state);
    render();
  }
  function nearestPart(){
    return missionSite.parts.find(p=>!state.collected.includes(p.id)&&distance(state.x,state.z,p.position)<=missionSite.reach);
  }
  function positionLabel(x:number,z:number){
    return `${Math.abs(Math.round(x))} m ${x<0?'W':'E'} · ${Math.abs(Math.round(z))} m ${z<0?'N':'S'}`;
  }
  function mapPoint(el:HTMLElement,point:Point){
    el.style.left=((point[0]+missionSite.extent)/(missionSite.extent*2)*87+6.5)+'%';
    el.style.top=((point[1]+missionSite.extent)/(missionSite.extent*2)*87+6.5)+'%';
  }
  mapPoint(stage.closest('article')!.querySelector<HTMLElement>('.map-spires')!,missionSite.landmarks[0].position);
  mapPoint(stage.closest('article')!.querySelector<HTMLElement>('.map-tracks')!,missionSite.landmarks[1].position);
  mapPoint($('map-wreck'),missionSite.wreck);
  function renderPosition(){
    mapPoint($('map-player'),[state.x,state.z]);
    const position=positionLabel(state.x,state.z);
    $('position').textContent='Astra · '+position;
    $('field-position').textContent=$('position').textContent;
    if(performance.now()-lastGraph>125&&state.samples.length){ drawChart(); lastGraph=performance.now(); }
    $('minimap').setAttribute('aria-label',`Crater rim map. Astra at ${position}. S marks Twin spires and T marks Wheel tracks.${state.phase==='recover'?' W marks the wreck.':''}`);
    if(state.phase!=='recover')return;
    if(hasFixes){
      const fix=flight.contacts[waypoint];
      $('waypoint-reading').textContent=`${distance(state.x,state.z,[fix.x,fix.z]).toFixed(1)} m · ${bearing(state.x,state.z,[fix.x,fix.z])}° · fix ±${fix.uncertainty.toFixed(1)} m`;
    }
    const part=nearestPart();
    interact.disabled=!part;interact.hidden=!part;
    interact.textContent=part?'Inspect '+part.name:'Inspect part';
    $('nearby').textContent=part?'Within reach':'Move within reach of a part.';
  }
  function drawChart(){
    chart.setAttribute('aria-label','Signal strength by distance. '+(state.samples.length?state.samples.map(s=>`${s.distance} m, ${s.strength}%`).join('; '):'No samples yet.'));
    const surface=chartSurface(chart);
    if(!surface)return;
    const {context,width:w,height:h,fontSize,color}=surface;
    const left=fontSize*2.5+8,bottom=h-fontSize*2,top=fontSize,right=w-fontSize;
    context.fillStyle=color('--muted');
    context.strokeStyle=color('--soft-line');
    for(const y of [0,50,100]){
      const py=bottom-y/100*(bottom-top);
      context.fillText(String(y),2,py+3);
      context.beginPath();context.moveTo(left,py);context.lineTo(right,py);context.stroke();
    }
    for(const x of (w < fontSize*24 ? [0,30,60] : [0,15,30,45,60])){
      const px=left+x/60*(right-left);
      context.fillText(String(x),px-5,h-6);
    }
    context.fillStyle=color('--cyan');
    for(const sample of state.samples){
      context.beginPath();
      context.arc(left+sample.distance/60*(right-left),bottom-sample.strength/100*(bottom-top),4,0,Math.PI*2);
      context.fill();
    }
    if(state.samples.length) {
      const range=distance(state.x,state.z,missionSite.wreck);
      const strength=signalStrength(range);
      context.strokeStyle=color('--cyan-strong'); context.lineWidth=2;
      context.beginPath();context.arc(left+range/60*(right-left),bottom-strength/100*(bottom-top),6,0,Math.PI*2);
      context.stroke(); context.lineWidth=1;
    }
  }
  new ResizeObserver(drawChart).observe(chart);
  void document.fonts.ready.then(drawChart);
  function render(){
    $('objective').textContent=objectives[state.phase];
    $('mission-layout').dataset.phase=state.phase;
    $('scanner-toggle').textContent=state.phase==='assemble'?'Workbench & inventory':state.phase==='recover'?'Map & inventory':'Map & scanner';
    $('scanner-toggle').hidden=state.phase==='complete';
    if(state.phase==='complete'&&toolsDrawer.open)toolsDrawer.close();
    const recentClues=[...(hasFixes?Object.values(recoveredLogs).map(log=>log.clue):initialClues),...state.observed.map(i=>missionSite.landmarks[i].clue),...state.collected.map(id=>partById(id)!.clue)];
    $('active-clues').hidden=state.phase==='briefing'||state.phase==='complete';
    $('active-clues').innerHTML=recentClues.slice(-2).map(clue=>`<li>${clue}</li>`).join('');
    solaris.subject=cutscene?'Odyssey · Scanner stabilization':state.phase==='assemble'?'Odyssey · Workbench':`Odyssey · ${objectives[state.phase]}`;
    solaris.selection=selected??undefined;
    $('progress').textContent=state.phase==='search'||state.phase==='locate'?`${state.observed.length}/2 observations`:state.phase==='recover'?`${state.collected.length}/3 recovered`:state.phase==='assemble'||state.phase==='complete'?`${state.fitted.length}/3 fitted`:'';
    briefing.hidden=state.phase!=='briefing';
    field.hidden=!['search','locate','recover'].includes(state.phase);
    nav.hidden=state.phase==='assemble'||state.phase==='complete';
    interact.hidden=state.phase!=='recover'||!nearestPart();
    $('recovery-waypoints').hidden=!hasFixes||state.phase!=='recover';
    if(hasFixes){
      $<HTMLSelectElement>('surface-waypoint').value=waypoint;
      $('waypoint-clue').textContent=recoveredLogs[waypoint].clue;
      for(const marker of document.querySelectorAll<HTMLElement>('[data-lock]'))marker.hidden=state.collected.includes(marker.dataset.lock as PartId);
      for(const option of $<HTMLSelectElement>('surface-waypoint').options)option.disabled=state.collected.includes(option.value as PartId);
    }
    $('map-wreck').hidden=state.phase!=='recover';
    $('wreck-legend').hidden=state.phase!=='recover';
    workbench.hidden=state.phase!=='assemble';
    $('inventory-panel').hidden=state.phase!=='recover'&&state.phase!=='assemble';
    $('mission-complete').hidden=state.phase!=='complete';
    $('inventory').innerHTML=missionSite.parts.map(p=>{
      const fitted=state.fitted.includes(p.id), collected=state.collected.includes(p.id);
      return `<tr><th scope="row">${p.name}</th><td class="${fitted||collected?'part-ready':'part-missing'}">${fitted?'✓ Fitted':collected?'✓ Collected':'Missing'}</td></tr>`;
    }).join('');
    $('clue-log').innerHTML=[...(hasFixes?Object.values(recoveredLogs).map(log=>log.clue):initialClues),...state.observed.map(i=>missionSite.landmarks[i].clue),...state.collected.map(id=>partById(id)!.clue)].map(v=>`<li>${v}</li>`).join('');
    $('part-angle').textContent=angle+'°';
    $('assembly-clue').textContent=partById(selected)?.clue??'Select a recovered part to read its fitting clue.';
    partSelect.value=selected??'';
    for(const option of partSelect.options)option.disabled=state.fitted.some(id=>id===option.value);
    for(const option of mountSelect.options)option.disabled=state.fitted.some(id=>partById(id)?.mount===option.value);
    renderPosition();
    drawChart();
    scene?.update(sceneState());
  }

  function move(seconds:number){
    if(!canWalk()){motion.stop();keys.clear();pointers.clear();return;}
    const input=relativeMovement([...keys,...pointers.values()],scene?.movementHeading()??0);
    const step=motion.step(input.x,input.z,seconds);
    stage.dataset.speed=step.speed.toFixed(3);
    if(!step.speed)return;
    state.x=Math.max(-missionSite.extent,Math.min(missionSite.extent,state.x+step.x));
    state.z=Math.max(-missionSite.extent,Math.min(missionSite.extent,state.z+step.z));
    renderPosition();
    const now=performance.now();
    if(now-lastSave>340){saveStory(state);lastSave=now;}
  }
  document.addEventListener('keydown',event=>{
    if((event.target as HTMLElement).matches('select,input,textarea')||!canWalk())return;
    const key=event.key.toLowerCase();
    if(movementKeys[key]){event.preventDefault();keys.add(movementKeys[key]);}
    if(key==='e'&&!event.repeat){event.preventDefault();nearestPart()&&state.phase==='recover'?inspect():scan();}
  });
  document.addEventListener('keyup',event=>{
    const direction=movementKeys[event.key.toLowerCase()];
    if(direction&&keys.delete(direction))saveStory(state);
  });
  function stopMovement(){keys.clear();pointers.clear();motion.stop();saveStory(state);}
  window.addEventListener('blur',stopMovement);
  window.addEventListener('pagehide',stopMovement);
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-move]')){
    const direction=button.dataset.move as GroundDirection;
    button.addEventListener('pointerdown',event=>{
      if(!canWalk())return;
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId,direction);
      event.preventDefault();
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture']){
      button.addEventListener(event,e=>{pointers.delete((e as PointerEvent).pointerId);saveStory(state);});
    }
    button.addEventListener('click',event=>{
      if(event.detail===0&&canWalk()){
        const {x,z}=relativeMovement([direction],scene?.movementHeading()??0);
        state.x=Math.max(-missionSite.extent,Math.min(missionSite.extent,state.x+x));
        state.z=Math.max(-missionSite.extent,Math.min(missionSite.extent,state.z+z));
        commit();
      }
    });
  }
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-camera]')){
    button.addEventListener('click',()=>scene?.adjust(button.dataset.camera!));
  }

  function showReading(reading:string){
    $('signal').textContent=reading;
    $('field-reading').textContent=reading;
  }
  function scan(){
    if(!canWalk())return;
    scene?.scan();
    const range=distance(state.x,state.z,missionSite.wreck);
    const direction=bearing(state.x,state.z,missionSite.wreck);
    const strength=signalStrength(range);
    state.samples.push({distance:Number(range.toFixed(1)),strength});
    state.samples=state.samples.slice(-24);
    showReading(`${range.toFixed(1)} m · ${direction}° ${['N','NE','E','SE','S','SW','W','NW'][Math.round(direction/45)%8]} · signal ${strength}%`);
    if(state.phase==='search'){
      const index=missionSite.landmarks.findIndex((l,i)=>!state.observed.includes(i)&&distance(state.x,state.z,l.position)<=missionSite.reach);
      if(index>=0){
        state.observed.push(index);
        say(missionSite.landmarks[index].clue);
        if(state.observed.length===2){
          setPhase('locate');
          say('Both readings point to the northeast rim. Follow the stronger signal and scan when you are close.');
        }
      }else{
        state.attempts++;
        say(range<=missionSite.reach?'I’m picking up interference. Take both landmark readings to isolate the signal.':'Reading logged. Take a scan within reach of a marked landmark to add its observation.');
      }
    }else if(state.phase==='locate'&&range<=missionSite.reach) reveal();
    else if(state.phase==='locate')state.attempts++;
    commit();
  }
  scanButton.addEventListener('click',scan);
  $('start-mission').addEventListener('click',()=>{
    $('control-notes').hidden=false;
    $('story-help').setAttribute('aria-expanded','true');
    setPhase('search');say('Start at either landmark. I’ll compare the bearings as you scan.');
    commit();scanButton.focus();
  });

  function reveal(){
    stopMovement();
    cutscene=true;
    cutDialog.showModal();
    say('There’s the rover. Hold the scan steady while I lock onto it.');
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) setCutMode('untimed');
    else setCutMode('timed');
  }
  function resumeTimer() {
    clearInterval(timer);
    deadline = performance.now() + timeRemaining;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline-performance.now())/1000));
      if (!remaining) { setCutMode('missed'); return; }
      $('cutscene-time').textContent=remaining+' s remaining';
    };
    tick();
    if(cutMode==='timed')timer=window.setInterval(tick,100);
  }

  function setCutMode(mode: typeof cutMode) {
    clearInterval(timer);
    cutMode=mode;
    cutDialog.dataset.mode=mode;
    $('retry-cutscene').hidden=mode!=='missed';
    $('untimed').hidden=mode==='untimed';
    $('stabilize').hidden=mode==='missed';
    $('cutscene-copy').textContent=mode==='missed'?'The signal slipped. Retry or switch to untimed input.':mode==='untimed'?'Select Stabilize when you’re ready.':'The rover is coming into view. Stabilize the scanner before the signal fades.';
    $('cutscene-time').textContent='';
    if(mode==='timed'){
      timeRemaining=8000;
      if(!pausedForChat)resumeTimer();
    }
    $(mode==='missed'?'retry-cutscene':'stabilize').focus({preventScroll:true});
  }

  solaris.pause = paused => {
    pausedForChat=paused;
    if(paused){
      stopMovement();
      if(cutscene&&cutMode==='timed'){
        timeRemaining=Math.max(1,deadline-performance.now());
        clearInterval(timer);
        $('cutscene-time').textContent='Paused for Solaris';
      }
    }else if(cutscene&&cutMode==='timed')resumeTimer();
  };
  solaris.mission = () => ({
    phase:state.phase, observed:[...state.observed], collected:[...state.collected],
    fitted:[...state.fitted], hints:state.hints, attempts:state.attempts,
    selection:selected??undefined, cutscene,
  });
  solaris.history=()=>state.history;
  $('stabilize').addEventListener('click',()=>{
    if(pausedForChat)return;
    if(cutMode==='timed'&&performance.now()>deadline){setCutMode('missed');return;}
    clearInterval(timer);cutscene=false;cutDialog.close();setPhase('recover');
    say('Signal locked. The impact scattered three parts around the wreck. Walk up to each to inspect it.');
    commit();scanButton.focus();
  });
  $('retry-cutscene').addEventListener('click',()=>setCutMode('timed'));
  $('untimed').addEventListener('click',()=>setCutMode('untimed'));
  cutDialog.addEventListener('cancel',event=>{event.preventDefault();setCutMode('untimed');});

  function inspect(){
    const part=nearestPart();
    if(!part||state.phase!=='recover')return;
    stopMovement();inspection=part.id;
    $('pickup-title').textContent=part.name;
    $('pickup-clue').textContent=part.clue;
    partDialog.showModal();
    $('collect-part').focus();
  }
  interact.addEventListener('click',inspect);
  $('collect-part').addEventListener('click',()=>{
    const part=partById(inspection);
    if(!part||state.collected.includes(part.id)||distance(state.x,state.z,part.position)>missionSite.reach)return;
    state.collected.push(part.id);
    waypoint=missionSite.parts.find(p=>!state.collected.includes(p.id))?.id??waypoint;
    inspection=null;
    partDialog.close();
    scene?.pickup(part.id);
    say(part.name+' recovered. '+part.clue);
    if(state.collected.length!==missionSite.parts.length){
      commit();scanButton.focus();return;
    }
    transitioning=true;
    commit();
    window.setTimeout(()=>{
      setPhase('assemble');
      transitioning=false;
      say('All parts recovered. Let’s see how they fit together.');
      commit();if(!document.querySelector('dialog[open]'))partSelect.focus();
    },scene&&!matchMedia('(prefers-reduced-motion: reduce)').matches?530:0);
  });

  function selectPart(id:PartId|null){
    if(state.phase!=='assemble'||(id&&state.fitted.includes(id)))return;
    if(selected!==id)angle=0;
    selected=id;
    $('fit-feedback').textContent='';
    render();
  }
  function selectMountFromScene(id:string){
    if(!missionSite.mounts.some(m=>m.id===id))return;
    mountSelect.value=id;
    if(selected)fit();
  }
  function fit(){
    if(state.phase!=='assemble')return;
    const part=partById(selected);
    const mount=missionSite.mounts.find(m=>m.id===mountSelect.value);
    if(!part||!mount){$('fit-feedback').textContent='Choose a part and a mount.';$('fit-feedback').classList.add('warning');return;}
    if(part.mount!==mount.id||angleDistance(angle,part.angle)>missionSite.tolerance){
      state.attempts++;
      const message=part.mount!==mount.id?`${part.name} doesn’t fit the ${mount.name.toLowerCase()}. ${part.clue}`:`${part.name} belongs here. Rotate it toward the ${mount.direction} marker.`;
      $('fit-feedback').textContent=message;
      $('fit-feedback').classList.add('warning');
      say(message);commit();
      return;
    }
    state.fitted.push(part.id);selected=null;angle=0;mountSelect.value='';
    scene?.fit(part.id);
    $('fit-feedback').textContent=part.name+' fitted.';
    $('fit-feedback').classList.remove('warning');
    if(state.fitted.length===missionSite.parts.length){
      setPhase('complete');
      scene?.complete();
      say('Opportunity is whole again. I’ve added the reconstruction to My Collection.');
    }else say(part.name+' is secure.');
    commit();
    if(state.fitted.length===missionSite.parts.length)$('mission-complete').querySelector('a')?.focus();
    else partSelect.focus();
  }
  partSelect.addEventListener('change',()=>selectPart(partById(partSelect.value)?.id??null));
  $('rotate-part').addEventListener('click',()=>{
    if(!selected){$('fit-feedback').textContent='Choose a part before rotating it.';return;}
    angle=(angle+45)%360;
    render();
  });
  $('fit-part').addEventListener('click',fit);
  $('replay').addEventListener('click',()=>{
    location.href=link('story')+'?replay=1';
  });

  function hint(){
    const detailed=state.hints>0||state.attempts>1;
    if(cutscene)return cutMode==='missed'?'Retry the scanner, or choose untimed input.':'Select Stabilize when you’re ready. You can switch to untimed input from the scanner prompt.';
    if(state.phase==='search'){
      const landmark=missionSite.landmarks.find((_,i)=>!state.observed.includes(i))!;
      return detailed?`Go to ${landmark.name} at ${positionLabel(...landmark.position)}. Get within 2.4 m and scan.`:'The map marks two landmarks. Take one reading at each.';
    }
    if(state.phase==='locate')return detailed?`Follow the bearing to ${positionLabel(...missionSite.wreck)}, then scan from within 2.4 m.`:'Follow the scanner bearing. Take another reading as you move and look for a stronger signal.';
    if(state.phase==='recover'){
      const part=missionSite.parts.find(p=>!state.collected.includes(p.id))!;
      return detailed?`Look for the ${part.name.toLowerCase()} at ${positionLabel(part.position[0],part.position[1])}. Inspect it when you are close.`:'Look for the cyan markers around the wreck. You need to walk within reach before inspecting a part.';
    }
    if(state.phase==='assemble'){
      const part=partById(selected)??missionSite.parts.find(p=>!state.fitted.includes(p.id))!;
      const mount=missionSite.mounts.find(m=>m.id===part.mount)!;
      return detailed?`Fit ${part.name.toLowerCase()} to the ${mount.name.toLowerCase()} at ${part.angle}°.`:part.clue;
    }
    return state.phase==='complete'?'Open My Collection to see the finished rover.':'Start the mission and use the map to find the two landmarks.';
  }
  solaris.hint=()=>{
    const line=hint();
    state.hints++;say(line);commit();
    return line;
  };
  $('clues-button').addEventListener('click',()=>{stopMovement();notes.showModal();});
  $('story-help').addEventListener('click',()=>{
    const controls=$('control-notes');
    controls.hidden=!controls.hidden;
    $('story-help').setAttribute('aria-expanded',String(!controls.hidden));
  });
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-close]')){
    button.addEventListener('click',()=>$<HTMLDialogElement>(button.dataset.close!).close());
  }
  if(!state.history.length)say('Astra, we have a signal near the crater rim. Review the clues before heading out.');
  else {const line=state.history.at(-1)!;$('scene-caption').textContent=line;captionTimer=window.setTimeout(()=>{$('scene-caption').textContent='';},Math.max(3500,Math.min(8500,line.length*48)));}
  const last=state.samples.at(-1);
  if(last)showReading(`Last scan · ${last.distance} m · signal ${last.strength}%`);
  commit();
}
