import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import './style.css';
import {asset, base, link, paths, destinations, apolloSource, evidence, mission, history, modelSource, rover, parts, remarks, questions, type Page} from './catalog';

const pathname = location.pathname.slice(base.length).replace(/(?:index\.html)?\/?$/, '');
const page: Page = (Object.keys(paths) as Page[]).find(p => paths[p].replace(/\/$/, '') === pathname) ?? 'home';
const parents: Record<Page, Page> = {home:'home', moon:'home', mars:'home', compare:'home', opportunity:'mars', experiment:'opportunity'};
const names: Record<Page,string> = {home:'Archive', moon:'Moon', mars:'Mars', compare:'Compare', opportunity:'Opportunity', experiment:'Dust & power'};
const app = document.querySelector<HTMLDivElement>('#app')!;
const a = (p:Page, label:string, cls='') => `<a class="${cls}" href="${link(p)}">${label}</a>`;
const external = (url:string,label:string,cls='source') => `<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`;
const eye = '<svg class="eye" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="18"/><ellipse cx="23" cy="23" rx="8" ry="17" transform="rotate(38 23 23)"/><circle class="pupil" cx="23" cy="23" r="4"/></svg>';
const section = (n:string,title:string) => `<div class="section-title"><span class="kicker">/ ${n}</span><h2>${title}</h2></div>`;
const photo = (entry: typeof evidence.panorama) => `<figure class="photo"><img loading="lazy" src="${asset(entry.image)}" alt="${entry.alt}"><figcaption><span class="kicker">${entry.label}</span><h3>${entry.title}</h3><p>${entry.body}</p>${external(entry.url,entry.credit)}</figcaption></figure>`;
const heading = (tag:string,title:string,intro:string) => `<div class="inner-heading"><a class="back kicker" href="${link(parents[page])}">← ${names[parents[page]]}</a><span class="kicker chip">${tag}</span><h1>${title}</h1><p>${intro}</p></div>`;
function home() {
  return `<section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy"><div class="kicker hero-tag"><span></span> THE FIELD ARCHIVE / VOL. 01</div>
    <h1 id="hero-title">OMNE<span>CARTA</span></h1><p>Explore the Moon and Mars through the NASA hardware that stayed behind.</p>
    <a class="button primary" href="#archive">Explore the archive <span aria-hidden="true">↘</span></a>
    <div class="hero-index kicker">01 / THE MOON &nbsp;&nbsp; 02 / MARS</div></div>
    <figure class="postcard"><div class="postcard-photo"><img src="${asset('astra.jpg')}" alt="Illustration of Astra in an EVA suit with an amber visor, standing on a dusty Martian plain"><div class="crosshair" aria-hidden="true">+</div></div><figcaption class="kicker"><span>FIG. 01 / ASTRA</span><span>FICTIONAL FIELD EXPLORER</span></figcaption></figure>
  </section>
  <section class="content archive" id="archive" aria-labelledby="archive-title">
    <div class="section-title"><span class="kicker">/ 01 &nbsp; DESTINATION INDEX</span><h2 id="archive-title">Choose a world</h2></div>
    <div class="tiles">
    ${(['moon','mars','opportunity'] as const).map((p,i) => {
      const d = p === 'opportunity' ? {name:'Opportunity',image:rover.image,kind:'ROVER EXHIBIT'} : destinations[p];
      return `<a class="tile" href="${link(p)}"><div class="tile-photo tile-${p}"><img src="${asset(d.image)}" alt="" loading="lazy"><span class="tile-number kicker">0${i+1}</span></div><div class="tile-title"><div><span class="kicker">${d.kind}</span><h3>${d.name}</h3></div><span class="arrow" aria-hidden="true">↗</span></div></a>`;
    }).join('')}</div>
    <div class="compare-strip"><div><strong>Two worlds, side by side</strong><p>Compare gravity, atmosphere, terrain, and water ice.</p></div>${a('compare','Compare worlds <span aria-hidden="true">↗</span>','button outline')}</div>
  </section>`;
}
function guide(id:'moon'|'mars') {
  const d=destinations[id];
  const eyesText = id === 'moon' ? 'In Eyes on the Solar System, select Earth’s Moon.' : 'Look for Valles Marineris or Olympus Mons, then return to meet Opportunity.';
  return `<article class="content page">${heading(`DESTINATION ${d.number} / ${d.kind}`,d.name,d.intro)}
  <div class="two-column">
    <figure class="photo guide-photo"><img src="${asset(d.image)}" alt="${d.alt}"><figcaption>${external('imageSource' in d ? d.imageSource : d.source,d.credit + ' · image source')}</figcaption></figure>
    <section class="panel facts"><span class="kicker">/ FIELD DATA</span><h2>Quick facts</h2><dl>${d.facts.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>${external(d.source,`NASA ${names[id]} Facts`)}</section>
  </div>
  ${section('01 / FIELD SITES',id==='moon'?'Apollo 15 at Hadley':'From landing to last contact')}
  <div class="tiles sites ${id==='moon'?'apollo-sites':''}">${d.places.map((s,i)=>`<section class="panel"><span class="kicker site-no">0${i+1} / ${s.tag}</span><h3>${s.name}</h3><p>${s.body}</p>${external(id==='moon'?apolloSource:history,id==='moon'?'NASA: Apollo 15 records':'NASA: Opportunity mission record')}</section>`).join('')}
  ${id==='moon'? `<figure class="photo apollo"><img loading="lazy" src="${asset('apollo.jpg')}" alt="Apollo 15 lunar module and Lunar Roving Vehicle at Hadley–Apennine"><figcaption>${external(apolloSource,'Apollo 15 equipment · NASA')}</figcaption></figure>` : ''}</div>
  <section class="compare-strip"><div><h2>Explore in 3D</h2><p>${eyesText}</p></div>${external(d.eyes,id==='moon'?'Explore in NASA Eyes':'Explore Mars in NASA Eyes','button primary')}</section>
  <div class="page-links">${id==='mars' ? a('opportunity','Open the Opportunity exhibit ↗','button dark') + a('experiment','Try the dust experiment ↗','button outline') : ''}${a('compare','Compare the Moon and Mars ↗','button outline')}</div></article>`;
}
function compare() {
  return `<article class="content page">${heading('FIELD DATA / COMPARISON','Moon vs. Mars','Both worlds are rocky and cold, but they present different challenges for a rover.')}
  <div class="two-column compare-content">
    <section class="panel"><span class="kicker">/ GRAVITY</span><h2>How much would you weigh?</h2><p>Earth is the 100% reference. Your mass stays the same, while the pull of gravity changes.</p>
    ${[['Earth',100],['Moon',17],['Mars',38]].map(([k,v])=>`<div class="gravity"><span>${k}</span><div><i style="--pct:${v}%"></i></div><strong>${v}%</strong></div>`).join('')}</section>
    <section class="panel"><span class="kicker">/ ROVER DESIGN</span><h2>Same wheels, different ground</h2><p>Lower gravity changes how hard wheels press into loose soil, which affects grip. On the Moon, designers have to contend with sharp dust that clings to equipment. On Mars, airborne dust can cut power to a solar rover.</p>${a('experiment','Try the dust and power experiment ↗','source')}</section>
  </div>
  <div class="table-wrap"><table><caption>At a glance</caption><thead><tr><th scope="col">Field condition</th><th scope="col">Moon</th><th scope="col">Mars</th></tr></thead><tbody>${destinations.moon.facts.map(([k,v],i)=>`<tr><th scope="row">${k}</th><td>${v}</td><td>${destinations.mars.facts[i][1]}</td></tr>`).join('')}</tbody></table></div>
  <div class="page-links">${external(destinations.moon.source,'NASA Moon Facts','button outline')}${external(destinations.mars.source,'NASA Mars Facts','button outline')}</div>
  </article>`;
}
function opportunity() {
  return `<article class="content page">${heading('MARS / EXHIBIT MER-B','Opportunity',rover.overview)}
  <div class="exhibit-meta kicker"><span>● ${rover.status.toUpperCase()}</span><span>2004–2018 / MARS SURFACE OPERATIONS</span></div>
  <div class="two-column exhibit">
    <section class="panel instrument-view"><div class="viewer-top kicker"><span>MER-B / ROVER ASSEMBLY</span><span>FIG. 01</span></div><div id="viewer">
      <div id="rover-fallback"><img src="${asset(rover.image)}" alt="NASA model of the six-wheeled rover, with the camera mast above the solar deck"><span class="fallback-tag camera">01 · CAMERA MAST</span><span class="fallback-tag solar">02 · SOLAR DECK</span></div>
      <p id="viewer-status" class="kicker" role="status">Loading interactive model…</p>
    </div><div class="viewer-credit">${external(modelSource,'Rover model and image · NASA/JPL-Caltech')}</div></section>
    <section class="panel parts"><span class="kicker">/ HARDWARE</span><h2>Inspect the rover</h2><p>Drag the model to rotate. Use the scroll wheel or pinch to zoom. You can also use the view controls below.</p>
    <div class="view-actions" hidden aria-label="Rover view controls"><button data-view="left" aria-label="Rotate left">←</button><button data-view="right" aria-label="Rotate right">→</button><button data-view="in" aria-label="Zoom in">+</button><button data-view="out" aria-label="Zoom out">−</button><button data-view="reset">Reset view</button></div>
    <div class="part-buttons">${parts.map((p,i)=>`<button data-part="${i}" aria-pressed="${i===0}">0${i+1} · ${p.name}</button>`).join('')}</div><div id="part-detail" aria-live="polite"></div></section>
  </div>
  ${section('01 / MISSION LOG','A 90-sol mission')}
  <ol class="timeline">${rover.timeline.map(([date,title,body])=>`<li><span class="kicker">${date}</span><h3>${title}</h3><p>${body}</p></li>`).join('')}</ol>
  ${external(mission,'NASA: Mars Exploration Rovers mission overview')}
  ${section('02 / IMAGE RECORD','Evidence from Mars')}
  <div class="two-column evidence">${photo(evidence.panorama)}${photo(evidence.berries)}</div>
  <section class="compare-strip"><div><h2>What happens when the sky goes dark?</h2><p>Change the dust level and see whether the rover’s battery gains or loses power.</p></div>${a('experiment','Try an experiment ↗','button primary')}</section></article>`;
}
function experiment() {
  return `<article class="content page">${heading('LAB 01 / SIMPLIFIED MODEL','Dust & solar power','How dusty does the sky need to get before Opportunity starts losing more power than it makes?')}
  <div class="two-column lab">
    <section class="panel sim-panel"><div class="sim-scene" id="sim-scene" aria-hidden="true"><div class="sun"></div><div class="beam"></div><div class="solar-panel"></div><div class="dust"></div><span class="kicker sun-tag">SUN</span><span class="kicker panel-tag">SOLAR ARRAY</span></div>
    <div class="controls"><label for="dust">Dust level <output id="dust-value" for="dust">0%</output></label><input id="dust" type="range" min="0" max="100" value="0" step="1"><div class="control-row"><button class="button dark" id="play" aria-pressed="false">▶ Play</button><button class="button outline" id="reset">Reset</button><span class="kicker" id="sim-state" role="status">PAUSED</span></div></div>
    </section>
    <section class="panel readings"><span class="kicker">/ LIVE READOUTS</span><h2>Power balance</h2>
    <div><span>Sunlight reaching panels</span><strong id="light">100%</strong></div><div><span>Net battery change</span><strong id="net">+55 units</strong></div><div><span>Battery level</span><strong id="charge">50%</strong></div>
    <meter id="battery" min="0" max="100" value="50" aria-label="Battery level"></meter><p id="balance" class="kicker" role="status">● CHARGING</p><p>These are teaching values. The model uses a fixed demand of 45 units, and the slider is not a measurement of Martian dust.</p></section>
  </div>
  ${section('01 / MISSION EVIDENCE','Dust in the archive')}<div class="two-column evidence">${photo(evidence.selfie)}<section class="panel"><span class="kicker">/ THE 2018 STORM</span><h3>Dust in the sky</h3><p>During the planet-wide storm, airborne dust dimmed the sunlight that reached the panels. Opportunity last contacted Earth on June 10, 2018.</p>${external(history,'NASA: Opportunity mission history')}</section></div>
  <div class="page-links">${a('opportunity','← Return to Opportunity','button outline')}${a('mars','Mars guide ↗','button outline')}</div></article>`;
}

const content = page==='home'?home():page==='moon'||page==='mars'?guide(page):page==='compare'?compare():page==='opportunity'?opportunity():experiment();
document.title = page==='home'?'Omnecarta · The Field Archive':`${names[page]} · Omnecarta`;
app.innerHTML = `<a class="skip" href="#main">Skip to content</a>
<header class="topbar"><a class="brand" href="${link('home')}" aria-label="Signal, Omnecarta archive"><span aria-hidden="true">&gt;_</span>signal<span class="brand-dot">.</span></a><nav aria-label="Main navigation">${(['home','moon','mars','compare'] as const).map(p=>`<a href="${link(p)}" ${page===p?'aria-current="page"':''}>${names[p]}</a>`).join('')}</nav><span class="edition kicker">SPACE APPS / FIELD FILES</span></header>
<main id="main" tabindex="-1">${content}</main>
<footer class="footer"><a class="brand" href="${link('home')}"><span aria-hidden="true">&gt;_</span>signal<span class="brand-dot">.</span></a><p>Omnecarta · The Field Archive</p>${external(mission,'NASA mission sources')}</footer>
<div class="companion-dock"><p class="ambient" id="ambient" role="status" hidden></p><button class="talk" id="talk" aria-haspopup="dialog">${eye}<span>Talk to Solaris</span></button></div>
<dialog id="companion" aria-labelledby="companion-title"><div class="dialog-heading">${eye}<div><span class="kicker">/ ARCHIVE COMPANION</span><h2 id="companion-title">Solaris</h2></div><button class="close" aria-label="Close Solaris">×</button></div>
<p id="context-line">${remarks[page]}</p><div class="dialog-questions">${questions[page].map((q,i)=>`<button data-question="${i}">${q.question}</button>`).join('')}</div><div id="answer" aria-live="polite"></div><label class="mute"><input type="checkbox" id="mute"> Mute ambient remarks</label></dialog>`;

const $ = <T extends HTMLElement = HTMLElement>(id:string) => document.getElementById(id) as T;
const dialog = $<HTMLDialogElement>('companion');
const ambient = $('ambient');
const mute = $<HTMLInputElement>('mute');
function getStored(storage:'local'|'session',key:string) {try{return window[storage+'Storage' as 'localStorage'|'sessionStorage'].getItem(key);}catch{return null;}}
function store(storage:'local'|'session',key:string,val:string) {try{window[storage+'Storage' as 'localStorage'|'sessionStorage'].setItem(key,val);}catch{/* optional */}}
mute.checked = getStored('local','omnecarta-mute')==='1';
let captionTimer = 0;
const shown = new Set<string>();
function caption(key:string,msg:string) {
  if (mute.checked || shown.has(key) || getStored('session','solaris-'+key)) return;
  shown.add(key);
  store('session','solaris-'+key,'1');
  ambient.textContent = msg;
  ambient.hidden = false;
  clearTimeout(captionTimer);
  captionTimer = window.setTimeout(()=>ambient.hidden=true,9000);
}
window.setTimeout(()=>{if(!dialog.open && !ambient.textContent) caption(page,remarks[page]);},1100);
$('talk').addEventListener('click',()=>{ ambient.hidden=true; dialog.showModal(); });
dialog.querySelector('.close')?.addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>$('talk').focus());
mute.addEventListener('change',()=>{store('local','omnecarta-mute',mute.checked?'1':'0');if(mute.checked)ambient.hidden=true;});
dialog.querySelectorAll<HTMLButtonElement>('[data-question]').forEach(b=>b.addEventListener('click',()=>{
  const q=questions[page][Number(b.dataset.question)];
  $('answer').innerHTML=`<p>${q.answer}</p>${q.source.startsWith('https:')?external(q.source,q.label):`<a class="source" href="${q.source}">${q.label} →</a>`}`;
}));
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||dialog.open||e.defaultPrevented||e.repeat)return;
  if(!ambient.hidden){ambient.hidden=true;return;}
  if(page!=='home')location.assign(link(parents[page]));
});
if(page==='opportunity'){
  function selectPart(i:number,announce=false){
    const p=parts[i];
    $('part-detail').innerHTML=`<h3>${p.name}</h3><p>${p.text}</p>${external(p.source,'NASA instrument reference')}`;
    document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',String(Number((b as HTMLElement).dataset.part)===i)));
    if(announce) caption('part-'+i,i===0?'Two eyes help the rover judge distance. Look for the pair up on the mast.':'Those panels kept Opportunity going. A dusty sky can make their job much harder.');
  }
  document.querySelectorAll<HTMLButtonElement>('.part-buttons [data-part]').forEach(b=>b.addEventListener('click',()=>selectPart(Number(b.dataset.part),true)));
  selectPart(0);
  import('./viewer').then(({showRover})=>showRover($('viewer'),asset(rover.model),i=>selectPart(i,true))).catch(()=>{
    $('viewer-status').textContent='Interactive model unavailable · labeled image shown';
  });
}
if(page==='experiment'){
  const config=rover.simulation;
  const dust=$<HTMLInputElement>('dust'), play=$<HTMLButtonElement>('play'), meter=$<HTMLMeterElement>('battery');
  let battery=config.initialBattery, playing=false, previous=0, frame=0, wasDraining=false;
  const light=()=>1-config.dustLoss*Number(dust.value)/100;
  const net=()=>config.maxOutput*light()-config.demand;
  const render=()=>{
    const draining=net()<0;
    $('dust-value').textContent=dust.value+'%';
    $('sim-scene').style.setProperty('--dust',String(Number(dust.value)/100));
    $('light').textContent=Math.round(light()*100)+'%';
    $('net').textContent=(net()>=0?'+':'')+Number(net().toFixed(1))+' units';
    $('charge').textContent=Math.round(battery)+'%';
    meter.value=battery;
    const balance=draining?'● DRAINING':'● CHARGING';
    if($('balance').textContent!==balance) $('balance').textContent=balance;
    $('balance').classList.toggle('negative',draining);
    if(draining&&!wasDraining)caption('drain','The panels are still making power. Why is the battery going down?');
    wasDraining=draining;
  };
  function tick(now:number){
    if(!playing)return;
    if(previous) battery=Math.min(100,Math.max(0,battery+net()*config.unitsPerSecond*Math.min((now-previous)/1000,0.1)));
    previous=now; render(); frame=requestAnimationFrame(tick);
  }
  function setPlaying(next:boolean){
    playing=next; previous=0; cancelAnimationFrame(frame);
    play.setAttribute('aria-pressed',String(playing)); play.textContent=playing?'Ⅱ Pause':'▶ Play';
    $('sim-state').textContent=playing?'RUNNING':'PAUSED';
    if(playing)frame=requestAnimationFrame(tick);
  }
  play.addEventListener('click',()=>setPlaying(!playing));
  $('reset').addEventListener('click',()=>{setPlaying(false); dust.value='0'; battery=config.initialBattery; render();});
  dust.addEventListener('input',render);
  document.addEventListener('visibilitychange',()=>{previous=0;});
  render();
}
