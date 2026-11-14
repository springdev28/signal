import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import './style.css';
import './story.css';
import { asset, base, link, paths, destinations, apolloSource, evidence, mission, sources, rover, parts, lunarParts, remarks, questions, type Page } from './catalog';

const pathname = location.pathname.slice(base.length).replace(/(?:index\.html)?\/?$/, '');
const page:Page = (Object.keys(paths) as Page[]).find(p=>paths[p].replace(/\/$/,'')===pathname) ?? 'home';
const parents:Record<Page,Page> = {home:'home',moon:'home',mars:'home',compare:'home',opportunity:'mars',lunar:'moon',experiment:'opportunity',story:'home',collection:'home'};
const names:Record<Page,string> = {home:'Explore',moon:'Moon',mars:'Mars',compare:'Compare',opportunity:'Opportunity',lunar:'Lunar Roving Vehicle',experiment:'Dust & power',story:'Play Story',collection:'My Collection'};
const app=document.querySelector<HTMLDivElement>('#app')!;
const a=(p:Page,label:string,cls='')=>`<a class="${cls}" href="${link(p)}">${label}</a>`;
const external=(url:string,label:string,cls='source')=>`<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`;
const eye='<svg class="eye" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="18"/><ellipse cx="23" cy="23" rx="8" ry="17" transform="rotate(38 23 23)"/><circle class="pupil" cx="23" cy="23" r="4"/></svg>';
const section=(title:string)=>`<div class="section-title"><h2>${title}</h2></div>`;
const photo=(entry:typeof evidence.panorama)=>`<figure class="photo"><img loading="lazy" src="${asset(entry.image)}" alt="${entry.alt}"><figcaption><h3>${entry.title}</h3><p>${entry.body}</p>${external(entry.url,entry.credit)}</figcaption></figure>`;
const heading=(title:string,intro:string)=>`<div class="inner-heading">${a(parents[page],'← '+names[parents[page]],'back kicker')}<h1>${title}</h1><p>${intro}</p></div>`;
const viewActions=`<div class="view-actions" hidden aria-label="View controls"><button data-view="left" aria-label="Rotate left">↶</button><button data-view="right" aria-label="Rotate right">↷</button><button data-view="in" aria-label="Zoom in">+</button><button data-view="out" aria-label="Zoom out">−</button><button data-view="reset">Reset view</button></div>`;
function modelCard(image:string,alt:string,caption:string){
  return `<section class="panel instrument-view"><div id="viewer">
    <div class="model-fallback"><img src="${asset(image)}" alt="${alt}"></div>
    <p class="model-status" id="viewer-status" role="status">Loading interactive model…</p>
  </div><div class="model-tools">${viewActions}<p>${caption}</p></div></section>`;
}
function home(){
  const cards=[['moon','The Moon','moon-illustration.jpg'],['mars','Mars','mars-illustration.jpg'],['opportunity','Opportunity',rover.image]] as const;
  return `<section class="hero" aria-labelledby="hero-title"><div class="hero-copy">
    <h1 id="hero-title">OMNE<span>CARTA</span></h1><p>Explore the Moon and Mars, or join Astra on a mission to recover and rebuild Opportunity.</p>
    <div class="mission-actions"><a class="button primary" href="#archive">Explore Omnecarta <span aria-hidden="true">↘</span></a>${a('story','Play Story','button hero-secondary')}</div>
    </div><figure class="postcard"><img src="${asset('astra.jpg')}" alt="Illustration of Astra in an EVA suit on Mars"><figcaption>Astra, fictional explorer</figcaption></figure>
  </section><section class="content archive" id="archive" aria-labelledby="archive-title">
    <div class="section-title"><h2 id="archive-title">Explore the archive</h2></div>
    <div class="tiles">${cards.map(([id,name,image])=>`<a class="tile" href="${link(id)}"><div class="tile-photo tile-${id}"><img src="${asset(image)}" alt="" loading="lazy"></div><div class="tile-title"><h3>${name}</h3><span class="arrow" aria-hidden="true">↗</span></div></a>`).join('')}</div>
    <div class="page-links">${a('compare','Compare the Moon and Mars','button outline')}${a('lunar','Lunar Roving Vehicle','button outline')}</div></section>`;
}
function guide(id:'moon'|'mars'){
  const d=destinations[id], moon=id==='moon';
  return `<article class="content page">${heading(d.name,d.intro)}<div class="two-column">
    ${modelCard(id+'-illustration.jpg',moon?'Illustration of the Moon with varied gray terrain':'Illustration of Mars with bright polar regions',moon?'Illustration of the Moon’s surface. Drag to orbit.':'Illustration of Mars with bright polar regions. Drag to orbit.')}
    <section class="panel facts"><h2>Quick facts</h2><dl>${d.facts.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>${external(sources.archive,'NASA Space Science Data Coordinated Archive')}</section>
  </div>${section(moon?'Apollo 15 at Hadley':'Opportunity’s route')}
  <div class="tiles sites">${d.places.map(place=>`<section class="panel"><h3>${place.name}</h3><p>${place.tag}</p><p>${place.body}</p>${external(moon?apolloSource:mission,moon?'NASA Lunar Roving Vehicles':'NASA Spirit & Opportunity')}</section>`).join('')}</div>
  <div class="page-links">${a(moon?'lunar':'opportunity',moon?'Open the Lunar Roving Vehicle exhibit':'Open the Opportunity exhibit','button dark')}${a('compare','Compare the Moon and Mars','button outline')}</div></article>`;
}
function compare(){
  return `<article class="content page">${heading('Moon vs. Mars','Compare the conditions a crew or rover would encounter on each world.')}
  <div class="two-column compare-content"><section class="panel"><h2>Surface gravity</h2><p>Earth is the 100% reference. The same object weighs less where gravity is weaker.</p>
    ${[['Earth',100],['Moon',17],['Mars',38]].map(([k,v])=>`<div class="gravity"><span>${k}</span><div aria-hidden="true"><i style="--pct:${v}%"></i></div><strong>${v}%</strong></div>`).join('')}
    ${external(sources.archive,'NASA Space Science Data Coordinated Archive')}</section>
    <section class="panel"><h2>Driving conditions</h2><p>On the Moon, Apollo crews used a rover to carry people and tools over loose ground. On Mars, a dust storm cut the sunlight available to Opportunity.</p>
    ${external(apolloSource,'NASA Lunar Roving Vehicles')} · ${external(mission,'NASA Spirit & Opportunity')}</section></div>
    <div class="table-wrap"><table><caption>Surface conditions</caption><thead><tr><th scope="col">Condition</th><th scope="col">Moon</th><th scope="col">Mars</th></tr></thead><tbody>${destinations.moon.facts.map(([k,v],i)=>`<tr><th scope="row">${k}</th><td>${v}</td><td>${destinations.mars.facts[i][1]}</td></tr>`).join('')}</tbody></table></div></article>`;
}
function exhibit(id:'opportunity'|'lunar'){
  const lunar=id==='lunar',title=names[id],instruments=lunar?lunarParts:parts;
  const timeline=lunar?[
    ['Jul 1971','Apollo 15 landing','The lunar module lands in the Hadley–Apennine region.'],
    ['Jul–Aug 1971','Surface traverses','The crew deploys the rover and travels with tools and samples.'],
    ['Aug 1971','Departure','The crew leaves the rover on the lunar surface.'],
  ]:rover.timeline;
  return `<article class="content page">${heading(title,lunar?'Apollo 15 used a Lunar Roving Vehicle to carry two astronauts and equipment across the Moon.':rover.overview)}
  <div class="two-column exhibit">
    ${modelCard(lunar?'lunar-illustration.jpg':rover.image,lunar?'Illustration of the Lunar Roving Vehicle, with four wheels and two seats':'Illustration of Opportunity, with six wheels, a raised camera mast, and a solar deck',lunar?'Original model based on NASA’s Lunar Roving Vehicles record.':'Original model based on NASA’s Spirit & Opportunity record.')}
    <section class="panel parts"><h2>Instruments</h2><p>Drag to rotate. Scroll or pinch to zoom, or use the view controls.</p>
    <table aria-label="Instruments"><thead><tr><th scope="col">Part</th><th scope="col">Function</th></tr></thead><tbody>
    ${instruments.map((part,i)=>`<tr><th scope="row"><button data-part="${i}" aria-pressed="${i===0}">${part.name}</button></th><td>${part.text}</td></tr>`).join('')}</tbody></table><div id="part-detail" class="sr-only" aria-live="polite"></div>
    ${external(lunar?apolloSource:mission,lunar?'NASA Lunar Roving Vehicles':'NASA Spirit & Opportunity')}</section>
  </div>${section('Mission timeline')}
  <ol class="timeline">${timeline.map(([date,event,body])=>`<li><span class="kicker">${date}</span><h3>${event}</h3><p>${body}</p></li>`).join('')}</ol>
  ${lunar?`<section class="panel"><h2>Field evidence</h2><p>The rover extended the crew’s reach beyond the landing site and carried equipment and samples during surface traverses.</p>${external(apolloSource,'NASA Lunar Roving Vehicles')}</section>`:
  ` ${section('Evidence from Mars')}<div class="two-column evidence">${photo(evidence.panorama)}${photo(evidence.selfie)}</div>
    <div class="page-links">${a('experiment','Try the dust experiment','button primary')}${a('story','Play Story','button outline')}</div>`}
  </article>`;
}
function experiment() {
  return `<article class="content page">${heading('Dust & solar power','How dusty does the sky need to get before Opportunity starts losing more power than it makes?')}
  <div class="two-column lab">
    <section class="panel sim-panel"><div class="sim-scene" id="sim-scene" aria-hidden="true"><div class="sun"></div><div class="beam"></div><div class="solar-panel"></div><div class="dust"></div><span class="kicker sun-tag">SUN</span><span class="kicker panel-tag">SOLAR ARRAY</span></div>
    <div class="controls"><label for="dust">Dust level <output id="dust-value" for="dust">0%</output></label><input id="dust" type="range" min="0" max="100" value="0" step="1"><div class="control-row"><button class="button dark" id="play" aria-pressed="false">▶ Play</button><button class="button outline" id="reset">Reset</button><span class="kicker" id="sim-state" role="status">PAUSED</span></div></div>
    </section>
    <section class="panel readings"><h2>Power balance</h2>
    <div><span>Sunlight reaching panels</span><strong id="light">100%</strong></div><div><span>Net battery change</span><strong id="net">+55 units</strong></div><div><span>Battery level</span><strong id="charge">50%</strong></div>
    <meter id="battery" min="0" max="100" value="50" aria-label="Battery level"></meter><p id="balance" class="kicker" role="status">● CHARGING</p><p>These are teaching values. The model uses a fixed demand of 45 units, and the slider is not a measurement of Martian dust.</p></section>
  </div>
  ${section('Dust in the archive')}<div class="two-column evidence">${photo(evidence.selfie)}<section class="panel"><h3>Dust in the sky</h3><p>During the planet-wide storm, airborne dust dimmed the sunlight that reached the panels. Opportunity last contacted Earth on June 10, 2018.</p>${external(mission,'NASA Spirit & Opportunity')}</section></div>
  <div class="page-links">${a('opportunity','← Return to Opportunity','button outline')}${a('mars','Mars guide ↗','button outline')}</div></article>`;
}

const story = page==='story'||page==='collection' ? await import('./story') : null;
const renderers:Partial<Record<Page,()=>string>> = {
  home, moon:()=>guide('moon'), mars:()=>guide('mars'), compare,
  opportunity:()=>exhibit('opportunity'), lunar:()=>exhibit('lunar'), experiment,
};
const content = page==='story'?story!.storyMarkup():page==='collection'?story!.collectionMarkup():renderers[page]!();
document.title = page==='home'?'Omnecarta':`${names[page]} · Omnecarta`;
app.innerHTML = `<a class="skip" href="#main">Skip to content</a>
<header class="topbar"><a class="brand" href="${link('home')}">Omnecarta</a>
<nav aria-label="Main navigation">${(['home','moon','mars','compare','story','collection'] as const).map(p=>`<a href="${link(p)}${p==='home'?'#archive':''}" ${page===p?'aria-current="page"':''}>${names[p]}</a>`).join('')}</nav></header>
<main id="main" tabindex="-1">${content}</main>
<footer class="footer"><a class="brand" href="${link('home')}">Omnecarta</a>${external(sources.archive,'NASA Space Science Data Coordinated Archive')}</footer>
${remarks[page] ? `<div class="companion-dock"><p class="ambient" id="ambient" role="status" hidden></p><button class="talk" id="talk" aria-haspopup="dialog">${eye}<span>Talk to Solaris</span></button></div>
<dialog id="companion" aria-labelledby="companion-title"><div class="dialog-heading">${eye}<h2 id="companion-title">Solaris</h2><button class="close" aria-label="Close Solaris">×</button></div>
<p id="context-line">${remarks[page]}</p><div class="dialog-questions">${questions[page]!.map((q,i)=>`<button data-question="${i}">${q.question}</button>`).join('')}</div><div id="answer" aria-live="polite"></div><label class="mute"><input type="checkbox" id="mute"> Mute ambient remarks</label></dialog>` : ''}`;
if(page==='story')story!.mountStory();

const $ = <T extends HTMLElement = HTMLElement>(id:string) => document.getElementById(id) as T;
const dialog = $<HTMLDialogElement>('companion');
const ambient = $('ambient');
const mute = $<HTMLInputElement>('mute');
function getStored(storage:'local'|'session',key:string) {try{return window[storage+'Storage' as 'localStorage'|'sessionStorage'].getItem(key);}catch{return null;}}
function store(storage:'local'|'session',key:string,val:string) {try{window[storage+'Storage' as 'localStorage'|'sessionStorage'].setItem(key,val);}catch{/* optional */}}
if(mute)mute.checked = getStored('local','omnecarta-mute')==='1';
let captionTimer = 0;
const shown = new Set<string>();
function caption(key:string,msg:string) {
  if (!mute || mute.checked || shown.has(key) || getStored('session','solaris-'+key)) return;
  shown.add(key);
  store('session','solaris-'+key,'1');
  ambient.textContent = msg;
  ambient.hidden = false;
  clearTimeout(captionTimer);
  captionTimer = window.setTimeout(()=>ambient.hidden=true,9000);
}
if(dialog)window.setTimeout(()=>{if(!dialog.open && !ambient.textContent) caption(page,remarks[page]!);},1100);
$('talk')?.addEventListener('click',()=>{ ambient.hidden=true; dialog.showModal(); });
dialog?.querySelector('.close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('close',()=>$('talk').focus());
mute?.addEventListener('change',()=>{store('local','omnecarta-mute',mute.checked?'1':'0');if(mute.checked)ambient.hidden=true;});
dialog?.querySelectorAll<HTMLButtonElement>('[data-question]').forEach(b=>b.addEventListener('click',()=>{
  const q=questions[page]![Number(b.dataset.question)];
  $('answer').innerHTML=`<p>${q.answer}</p>${q.source.startsWith('https:')?external(q.source,q.label):`<a class="source" href="${q.source}">${q.label} →</a>`}`;
}));
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||document.querySelector('dialog[open]')||e.defaultPrevented||e.repeat)return;
  if(ambient&&!ambient.hidden){ambient.hidden=true;return;}
  if(page!=='home'&&page!=='story')location.assign(link(parents[page]));
});
if(page==='opportunity'||page==='lunar'||page==='moon'||page==='mars'){
  const modelPage=page;
  const instruments=page==='lunar'?lunarParts:parts;
  function selectPart(index:number,announce=false){
    const part=instruments[index];
    if(!part||!$('part-detail'))return;
    $('part-detail').innerHTML=`<h3>${part.name}</h3><p>${part.text}</p>`;
    document.querySelectorAll<HTMLButtonElement>('[data-part]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.part)===index)));
    if(announce)caption('part-'+modelPage+index,part.text);
  }
  document.querySelectorAll<HTMLButtonElement>('[data-part]').forEach(button=>button.addEventListener('click',()=>selectPart(Number(button.dataset.part),true)));
  selectPart(0);
  import('./archive-scene').then(({showArchiveModel})=>showArchiveModel($('viewer'),modelPage,i=>selectPart(i,true))).catch(()=>{
    $('viewer-status').textContent='Interactive model unavailable. Illustration shown.';
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
