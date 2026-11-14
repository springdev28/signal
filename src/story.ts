import { link, rover } from './catalog';
import { angleDistance, bearing, collectionHasRover, distance, loadStory, missionSite, partById, saveStory, signalStrength, startStory, type PartId, type Phase, type Point } from './mission';
import { createStoryScene } from './story-scene';

const initialClues = [
  'An old beacon is broadcasting near the crater rim.',
  'Take a scanner reading at the twin spires and compare the bearing from the wheel tracks.',
  'Follow the tracks north. A rising signal means you are getting closer.',
];
const objectives:Record<Phase,string> = {
  briefing:'Locate the rover, recover three parts, and rebuild it.',
  search:'Scan at the twin spires and the wheel tracks.',
  locate:'Follow the signal. Scan within reach to reveal the wreck.',
  recover:'Inspect and recover three parts near the wreck.',
  assemble:'Fit all three parts to the correct mounts.',
  complete:'Opportunity is in My Collection.',
};

export function storyMarkup() {
  return `<article class="content story"><header class="story-heading">
  <h1>Play Story</h1><p>Opportunity recovery · ${missionSite.name} · Fictional simulation</p>
  </header><div id="story-objective"><strong id="objective"></strong><span id="progress"></span></div>
  <div class="mission-layout"><div class="mission-main">
  <div id="mission-stage"><p id="scene-status" role="status">Loading the 3D scene…</p>
    <p class="scene-caption" id="scene-caption" role="status"></p>
    <div class="scene-controls" aria-label="Camera controls">
      <button data-camera="left" aria-label="Orbit left">↶</button><button data-camera="right" aria-label="Orbit right">↷</button>
      <button data-camera="in" aria-label="Zoom in">+</button><button data-camera="out" aria-label="Zoom out">−</button>
      <button data-camera="reset">Reset view</button>
    </div>
  </div>
  <div id="briefing" class="mission-panel">
    <h2>Briefing</h2><ol>${initialClues.map(clue=>`<li>${clue}</li>`).join('')}</ol>
    <p>Move with WASD, the arrow keys, or the direction buttons. Drag to orbit, and scroll or pinch to zoom. Press E or use the action button to scan and interact.</p>
    <button class="button primary" id="start-mission">Start mission</button>
  </div>
  <div id="field-controls" class="mission-panel field-controls" hidden>
    <div class="direction-pad" aria-label="Move Astra">
      <button data-move="north" aria-label="Move north">↑</button><button data-move="west" aria-label="Move west">←</button>
      <button data-move="south" aria-label="Move south">↓</button><button data-move="east" aria-label="Move east">→</button>
    </div>
    <div class="field-actions"><button class="button primary" id="scan">Scan</button><button class="button outline" id="interact" disabled>Inspect part</button><p id="nearby"></p><p id="field-reading" role="status">Scan to take a reading.</p><p id="field-position"></p></div>
  </div>
  <div id="workbench" class="mission-panel" hidden>
    <h2>Workbench</h2><p>Choose a part and a mount. Rotate the part to match the mount, then choose Fit Part. You can also drag the selected part onto its mount.</p>
    <div id="assembly-controls">
      <div class="assembly-select">
        <label>Part <select id="assembly-part"><option value="">Select a part</option>${missionSite.parts.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></label>
        <label>Mount <select id="assembly-mount"><option value="">Select a mount</option>${missionSite.mounts.map(m=>`<option value="${m.id}">${m.name} · ${m.direction} marker</option>`).join('')}</select></label>
      </div>
      <div class="mission-actions"><button id="rotate-part" class="button outline">Rotate 45°</button><output id="part-angle" aria-live="polite">0°</output><button class="button primary" id="fit-part">Fit Part</button></div>
    </div>
    <p id="fit-feedback" role="status"></p>
  </div>
  <div id="mission-complete" class="mission-panel" hidden><h2>Opportunity reassembled</h2><div class="mission-actions">
    <a href="${link('collection')}" class="button primary">My Collection</a>
    <a href="${link('opportunity')}" class="button outline">Open Exhibit</a>
    <button id="replay" class="button outline">Replay Story</button>
  </div></div>
  </div><aside class="mission-sidebar">
    <section id="navigation-tools" class="mission-panel"><h2>Map &amp; scanner</h2>
      <div id="minimap" class="minimap" role="img" aria-label="Map of the crater rim"><span class="map-north">N ↑</span>
        <span class="map-marker map-spires" title="Twin spires">S</span><span class="map-marker map-tracks" title="Wheel tracks">T</span>
        <span id="map-wreck" class="map-marker map-wreck" title="Wreck" hidden>W</span><span id="map-player" class="map-marker map-player" title="Astra">A</span>
      </div>
      <p class="map-legend">A Astra · S Twin spires · T Wheel tracks<span id="wreck-legend" hidden> · W Wreck</span></p>
      <p id="position"></p><p id="signal">Scan to take a reading.</p>
      <figure class="signal-figure"><canvas id="signal-chart" width="330" height="144" role="img" aria-label="Signal strength by distance. No samples yet."></canvas><figcaption>Signal (%) by distance (m) · cyan dots are scans</figcaption></figure>
    </section>
    <section class="mission-panel"><div class="mission-actions"><button class="button outline" id="clues-button">Clues</button><button class="button dark" id="talk-story">Talk to Solaris</button></div>
      <h2>Inventory</h2><div class="inventory-wrap"><table aria-label="Inventory"><thead><tr><th>Part</th><th>Clue</th><th>State</th></tr></thead><tbody id="inventory"></tbody></table></div>
    </section>
  </aside></div>
  <dialog class="story-dialog" id="story-notes" aria-labelledby="notes-title"><div class="dialog-heading"><h2 id="notes-title">Clues</h2><button class="close" data-close="story-notes" aria-label="Close clues">×</button></div>
    <ol id="clue-log"></ol><p>Move with WASD, arrow keys, or the direction buttons. Press E to scan or inspect.</p></dialog>
  <dialog class="story-dialog" id="story-solaris" aria-labelledby="solaris-title"><div class="dialog-heading"><h2 id="solaris-title">Solaris</h2><button class="close" data-close="story-solaris" aria-label="Close Solaris">×</button></div>
    <button class="button primary" id="ask-hint">Request hint</button><p id="story-hint" role="status"></p><h3>Dialogue history</h3><ol id="dialogue-history"></ol></dialog>
  <dialog class="story-dialog" id="story-cutscene" aria-labelledby="cutscene-title"><h2 id="cutscene-title">Stabilize the scanner</h2>
    <p id="cutscene-copy">The rover is coming into view. Stabilize the scanner to finish the reveal.</p>
    <p id="cutscene-time" aria-hidden="true"></p>
    <div class="mission-actions"><button class="button primary" id="stabilize">Stabilize</button><button class="button outline" id="retry-cutscene" hidden>Retry</button><button class="button outline" id="untimed">Use untimed input</button></div>
  </dialog>
  <dialog class="story-dialog" id="part-dialog" aria-labelledby="pickup-title"><div class="dialog-heading"><h2 id="pickup-title">Inspect part</h2><button class="close" data-close="part-dialog" aria-label="Close part inspection">×</button></div>
    <p id="pickup-clue"></p><button class="button primary" id="collect-part">Collect part</button></dialog>
  </article>`;
}

export function collectionMarkup() {
  return `<article class="content page collection"><div class="inner-heading"><h1>My Collection</h1>
  <p>Crafts you’ve assembled in Play Story.</p></div>
  ${collectionHasRover()? `<section class="panel collection-card"><h2>Opportunity</h2><p>Reassembled in the fictional ${missionSite.name} mission.</p>
  <div class="mission-actions"><a class="button primary" href="${link('opportunity')}" >Open Exhibit</a><a class="button outline" href="${link('story')}?replay=1">Replay Story</a></div></section>` :
  `<p>Your collection is empty. Assemble Opportunity to add it here.</p><a class="button primary" href="${link('story')}">Play Story</a>`}</article>`;
}

export function mountStory() {
  const $ = <T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
  let state=loadStory();
  if (new URLSearchParams(location.search).has('replay')) {
    state=startStory();
    saveStory(state);
    history.replaceState(null,'',link('story'));
  }
  let selected:PartId|null=null, angle=0, inspection:PartId|null=null;
  let cutscene=false, cutMode:'timed'|'missed'|'untimed'='timed', timer=0, deadline=0;
  let lastSave=0;
  const keys=new Set<string>();
  const pointers=new Map<number,string>();
  const nav=$('navigation-tools'), stage=$('mission-stage');
  const briefing=$('briefing'), field=$('field-controls'), workbench=$('workbench');
  const scanButton=$<HTMLButtonElement>('scan'), interact=$<HTMLButtonElement>('interact');
  const partSelect=$<HTMLSelectElement>('assembly-part'), mountSelect=$<HTMLSelectElement>('assembly-mount');
  const cutDialog=$<HTMLDialogElement>('story-cutscene'), partDialog=$<HTMLDialogElement>('part-dialog');
  const notes=$<HTMLDialogElement>('story-notes'), solaris=$<HTMLDialogElement>('story-solaris');
  const chart=$<HTMLCanvasElement>('signal-chart');
  const canWalk=()=>['search','locate','recover'].includes(state.phase)&&!document.querySelector('dialog[open]');
  const sceneState=()=>({save:state,selection:selected,angle,cutscene});
  let scene:ReturnType<typeof createStoryScene>|undefined;
  try {
    scene=createStoryScene(stage,{frame:move,pick:selectPart,mount:selectMountFromScene});
    $('scene-status').hidden=true;
    scene.update(sceneState());
  } catch {
    $('scene-status').textContent='3D is unavailable. You can still use the map, scanner, and mission controls.';
    requestAnimationFrame(function fallback(now){
      move(lastFrame ? Math.min(.05,(now-lastFrame)/1000) : 0);
      lastFrame=now;
      requestAnimationFrame(fallback);
    });
  }
  let lastFrame=0;

  function say(line:string) {
    state.history.push(line);
    state.history=state.history.slice(-30);
    $('scene-caption').textContent='Solaris: '+line;
    if(solaris.open) renderHistory();
  }
  function renderHistory(){
    $('dialogue-history').replaceChildren(...state.history.map(line=>{
      const li=document.createElement('li');
      li.textContent=line;
      return li;
    }));
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
    el.style.left=((point[0]+18)/36*87+6.5)+'%';
    el.style.top=((point[1]+18)/36*87+6.5)+'%';
  }
  mapPoint(stage.closest('article')!.querySelector<HTMLElement>('.map-spires')!,missionSite.landmarks[0].position);
  mapPoint(stage.closest('article')!.querySelector<HTMLElement>('.map-tracks')!,missionSite.landmarks[1].position);
  mapPoint($('map-wreck'),missionSite.wreck);
  function renderPosition(){
    mapPoint($('map-player'),[state.x,state.z]);
    const position=positionLabel(state.x,state.z);
    $('position').textContent='Astra · '+position;
    $('field-position').textContent=$('position').textContent;
    $('minimap').setAttribute('aria-label',`Crater rim map. Astra at ${position}. S marks Twin spires and T marks Wheel tracks.${state.phase==='recover'?' W marks the wreck.':''}`);
    if(state.phase!=='recover')return;
    const part=nearestPart();
    interact.disabled=!part;
    interact.textContent=part?'Inspect '+part.name:'Inspect part';
    $('nearby').textContent=part?'Within reach':'Move within reach of a part.';
  }
  function drawChart(){
    const context=chart.getContext('2d');
    if(!context)return;
    const w=chart.width,h=chart.height,left=36,bottom=h-24,top=14,right=w-12;
    context.clearRect(0,0,w,h);
    context.font='12px monospace';
    context.fillStyle='#ede2ce';
    context.strokeStyle='#726055';
    for(const y of [0,50,100]){
      const py=bottom-y/100*(bottom-top);
      context.fillText(String(y),2,py+3);
      context.beginPath();context.moveTo(left,py);context.lineTo(right,py);context.stroke();
    }
    for(const x of [0,15,30,45,60]){
      const px=left+x/60*(right-left);
      context.fillText(String(x),px-5,h-6);
    }
    context.fillStyle='#82eeea';
    for(const sample of state.samples){
      context.beginPath();
      context.arc(left+sample.distance/60*(right-left),bottom-sample.strength/100*(bottom-top),4,0,Math.PI*2);
      context.fill();
    }
    chart.setAttribute('aria-label','Signal strength by distance. '+(state.samples.length?state.samples.map(s=>`${s.distance} m, ${s.strength}%`).join('; '):'No samples yet.'));
  }
  function render(){
    $('objective').textContent=objectives[state.phase];
    $('progress').textContent=state.phase==='search'||state.phase==='locate'?`${state.observed.length}/2 observations`:state.phase==='recover'?`${state.collected.length}/3 recovered`:state.phase==='assemble'||state.phase==='complete'?`${state.fitted.length}/3 fitted`:'';
    briefing.hidden=state.phase!=='briefing';
    field.hidden=!['search','locate','recover'].includes(state.phase);
    nav.hidden=state.phase==='assemble'||state.phase==='complete';
    interact.hidden=state.phase!=='recover';
    $('map-wreck').hidden=state.phase!=='recover';
    $('wreck-legend').hidden=state.phase!=='recover';
    workbench.hidden=state.phase!=='assemble';
    $('mission-complete').hidden=state.phase!=='complete';
    $('inventory').innerHTML=missionSite.parts.map(p=>{
      const fitted=state.fitted.includes(p.id), collected=state.collected.includes(p.id);
      return `<tr><th scope="row">${p.name}</th><td>${collected?p.clue:'—'}</td><td>${fitted?'✓ Fitted':collected?'✓ Collected':'Missing'}</td></tr>`;
    }).join('');
    $('clue-log').innerHTML=[...initialClues,...state.observed.map(i=>missionSite.landmarks[i].clue),...state.collected.map(id=>partById(id)!.clue)].map(v=>`<li>${v}</li>`).join('');
    $('part-angle').textContent=angle+'°';
    partSelect.value=selected??'';
    for(const option of partSelect.options)option.disabled=state.fitted.some(id=>id===option.value);
    for(const option of mountSelect.options)option.disabled=state.fitted.some(id=>partById(id)?.mount===option.value);
    renderPosition();
    drawChart();
    scene?.update(sceneState());
  }

  const vectors:Record<string,Point>={north:[0,-1],south:[0,1],west:[-1,0],east:[1,0]};
  function move(seconds:number){
    if(!canWalk()||(!keys.size&&!pointers.size))return;
    let dx=0,dz=0;
    for(const direction of new Set([...keys,...pointers.values()])){
      const [x,z]=vectors[direction];dx+=x;dz+=z;
    }
    const length=Math.hypot(dx,dz);
    if(!length)return;
    state.x=Math.max(-18,Math.min(18,state.x+dx/length*seconds*6.6));
    state.z=Math.max(-18,Math.min(18,state.z+dz/length*seconds*6.6));
    renderPosition();
    const now=performance.now();
    if(now-lastSave>340){saveStory(state);lastSave=now;}
  }
  const controls:Record<string,string>={w:'north',arrowup:'north',s:'south',arrowdown:'south',a:'west',arrowleft:'west',d:'east',arrowright:'east'};
  document.addEventListener('keydown',event=>{
    if((event.target as HTMLElement).matches('select,input,textarea')||!canWalk())return;
    const key=event.key.toLowerCase();
    if(controls[key]){event.preventDefault();keys.add(controls[key]);}
    if(key==='e'&&!event.repeat){event.preventDefault();nearestPart()&&state.phase==='recover'?inspect():scan();}
  });
  document.addEventListener('keyup',event=>{
    const direction=controls[event.key.toLowerCase()];
    if(direction&&keys.delete(direction))saveStory(state);
  });
  function stopMovement(){keys.clear();pointers.clear();saveStory(state);}
  window.addEventListener('blur',stopMovement);
  window.addEventListener('pagehide',stopMovement);
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-move]')){
    const direction=button.dataset.move!;
    button.addEventListener('pointerdown',event=>{
      if(!canWalk())return;
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId,direction);
      move(.11);
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture']){
      button.addEventListener(event,e=>{pointers.delete((e as PointerEvent).pointerId);saveStory(state);});
    }
    button.addEventListener('click',event=>{
      if(event.detail===0&&canWalk()){
        const [x,z]=vectors[direction];
        state.x=Math.max(-18,Math.min(18,state.x+x));
        state.z=Math.max(-18,Math.min(18,state.z+z));
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
  function setCutMode(mode:typeof cutMode){
    clearInterval(timer);
    cutMode=mode;
    $('retry-cutscene').hidden=mode!=='missed';
    $('untimed').hidden=mode==='untimed';
    $('stabilize').hidden=mode==='missed';
    $('cutscene-copy').textContent=mode==='missed'?'The signal slipped. Retry or switch to untimed input.':mode==='untimed'?'Select Stabilize when you’re ready.':'The rover is coming into view. Stabilize the scanner before the signal fades.';
    $('cutscene-time').textContent='';
    if(mode==='timed'){
      deadline=performance.now()+8000;
      const tick=()=>{
        const remaining=Math.max(0,Math.ceil((deadline-performance.now())/1000));
        if(!remaining){setCutMode('missed');return;}
        $('cutscene-time').textContent=remaining+' s remaining';
      };
      tick();timer=window.setInterval(tick,100);
    }
    $(mode==='missed'?'retry-cutscene':'stabilize').focus();
  }
  $('stabilize').addEventListener('click',()=>{
    if(cutMode==='timed'&&performance.now()>deadline){setCutMode('missed');return;}
    clearInterval(timer);cutscene=false;cutDialog.close();setPhase('recover');
    say('Scanner locked. Three pieces are scattered around the wreck. Walk up to each to inspect it.');
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
    state.collected.push(part.id);inspection=null;partDialog.close();
    scene?.pickup(part.id);
    say(part.name+' recovered. '+part.clue);
    if(state.collected.length===missionSite.parts.length){
      setPhase('assemble');
      say('All parts accounted for. Use the clues to fit them at the workbench.');
    }
    commit();
    if(state.collected.length===missionSite.parts.length)partSelect.focus();
    else scanButton.focus();
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
    if(!part||!mount){$('fit-feedback').textContent='Choose a part and a mount.';return;}
    if(part.mount!==mount.id||angleDistance(angle,part.angle)>missionSite.tolerance){
      state.attempts++;
      const message=part.mount!==mount.id?`${part.name} doesn’t fit the ${mount.name.toLowerCase()}. ${part.clue}`:`${part.name} belongs here. Rotate it toward the ${mount.direction} marker.`;
      $('fit-feedback').textContent=message;
      say(message);commit();
      return;
    }
    state.fitted.push(part.id);selected=null;angle=0;mountSelect.value='';
    scene?.fit(part.id);
    $('fit-feedback').textContent=part.name+' fitted.';
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
    state=startStory();selected=null;angle=0;mountSelect.value='';
    showReading('Scan to take a reading.');
    say('Astra, we have a signal near the crater rim. Review the clues before heading out.');
    commit();$('start-mission').focus();
  });

  function hint(){
    const detailed=state.hints>0||state.attempts>1;
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
  $('ask-hint').addEventListener('click',()=>{
    const line=hint();state.hints++;
    $('story-hint').textContent=line;say(line);commit();
  });
  $('clues-button').addEventListener('click',()=>{stopMovement();notes.showModal();});
  $('talk-story').addEventListener('click',()=>{
    stopMovement();$('story-hint').textContent='';renderHistory();solaris.showModal();
  });
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-close]')){
    button.addEventListener('click',()=>$<HTMLDialogElement>(button.dataset.close!).close());
  }
  if(!state.history.length)say('Astra, we have a signal near the crater rim. Review the clues before heading out.');
  else $('scene-caption').textContent='Solaris: '+state.history.at(-1);
  const last=state.samples.at(-1);
  if(last)showReading(`Last scan · ${last.distance} m · signal ${last.strength}%`);
  commit();
}
