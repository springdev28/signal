import { asset, link as routeLinkHref, destinations, exhibits, evidence, sources, type AtlasSite, type HardwareId, type Page, type WorldId } from './catalog';
import { drawerMarkup, icon, mountDrawer, routeLink, sourceLink, viewButtons } from './ui';
import type { SolarisContext } from './solaris';

const names = { atlas: 'Omnecarta', moon: 'Moon', mars: 'Mars', compare: 'Compare' } as const;

export function atlasBar(active?: Page) {
  return `<div class="atlas-bar">
    <a class="atlas-brand" href="${routeLinkHref('atlas')}">${icon('layers',19)} <span>Omnecarta</span></a>
    <nav class="atlas-tabs" aria-label="Atlas navigation"><a href="${routeLinkHref('atlas')}?resource=apollo">Mission library</a>
      ${(['moon','mars','compare'] as const).map(id => active === id
        ? `<span aria-current="page">${names[id]}</span>` : routeLink(id, names[id])).join('')}
    </nav>
  </div>`;
}


export function atlasOverview() {
  return `<article class="shell atlas-overview">
    ${atlasBar('atlas')}
    <div class="overview-heading"><h1>Choose a world</h1><p>Find a mission site, then inspect the hardware it left behind.</p></div>
    <div class="world-deck" aria-label="Choose a world">
      ${(['moon','mars'] as const).map(id => {
        const world = destinations[id];
        return `<a class="world-choice ${id}" href="${routeLinkHref(id)}">
          <img src="${asset(id + '-illustration.jpg')}" alt="">
          <div class="world-choice-label"><div><h2>${world.name}</h2><p>${world.kind}</p></div>${icon('arrow',23)}</div>
        </a>`;
      }).join('')}
    </div>
    ${routeLink('compare', 'Compare the Moon and Mars', 'quiet-link', true)}
  </article>`;
}

function modelFallback(image: string, alternative: string) {
  return `<div class="model-fallback"><img src="${asset(image)}" alt="${alternative}"></div>
    <p class="view-state" role="status">Loading 3D view…</p>`;
}

export function atlasWorld(id: WorldId) {
  const world = destinations[id];
  const odyssey = new URLSearchParams(location.search).get('mission') === 'odyssey';
  return `<article class="shell atlas-world ${id}">
    ${atlasBar(id)}
    <div class="survey-grid">
      <section class="view-frame world-frame" aria-label="${world.name} globe">
        <div class="model-canvas">
          ${modelFallback(id + '-illustration.jpg', id === 'moon'
            ? 'The Moon with bright highlands, dark basalt plains, and craters'
            : 'Mars with rust-colored plains, dark surface markings, and polar ice')}
          <div class="orbital-guide" aria-hidden="true"></div>
        </div>
        <header class="view-title"><a class="back-link" href="${routeLinkHref('atlas')}">← Orbital navigation</a><p class="eyebrow">${odyssey ? 'Odyssey · Locate the transmission' : 'Surface approach'}</p><h1>${world.name}</h1><p>Locate a site, scan, then deploy Astra.</p></header>
        <div class="view-bottom"><span class="coordinates" data-coordinates aria-label="View center">—</span>${viewButtons(true)}
          <button class="button drawer-toggle" type="button" aria-controls="detail-drawer" aria-expanded="false">${icon('sliders',18)} Details</button>
        </div>
      </section>
      <aside class="detail-rail" id="details">
        <details class="panel fact-panel">
          <summary>Surface facts</summary><p class="world-intro">${world.intro}</p>
          <dl>${world.facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
          ${sourceLink(sources.archive, 'NASA Data Archive')}
        </details>
        <section class="panel site-panel">
          <h2>Mission site</h2>
          ${world.sites.map(site => `<button type="button" class="item-control" data-site-control="${site.id}" aria-expanded="false">
            ${icon('pin',18)}<span>${site.mission}<small>${site.name}</small></span>${icon('arrow',16)}
          </button>`).join('')}
          <div id="descent-controls" hidden><p id="site-lock-status" role="status">Site selected. Scan to lock the descent coordinates.</p><button class="button primary" id="scan-site">${icon('scan',17)} Scan site</button><button class="button primary" id="deploy-surface" hidden>Deploy Astra ${icon('lower',17)}</button></div>
          <div id="site-detail" hidden></div>
        </section>
      </aside>
    </div>
    <div class="view-note"><span>Drag to orbit. Scroll or pinch to zoom.</span>${sourceLink(id === 'moon' ? sources.archive : sources.viking, world.textureCredit)}</div>
    ${drawerMarkup('World details')}
  </article>`;
}

export function mountWorld(id: WorldId, context: SolarisContext) {
  const world = destinations[id];
  const odyssey = new URLSearchParams(location.search).get('mission') === 'odyssey';
  const sites: readonly AtlasSite[] = odyssey ? [{id:'perseverance',name:'Recovery zone',mission:'Lost transmission',latitude:-2.3,longitude:-5.2,coordinates:'Fictional signal · Perseverance Valley',detail:'A damaged rover is transmitting from the crater rim. Scan the source, then deploy Astra to find the wreck on foot.',exhibit:'opportunity'}] : world.sites;
  const frame = document.querySelector<HTMLElement>('.world-frame')!;
  const detail = document.querySelector<HTMLElement>('#site-detail')!;
  const openDrawer = mountDrawer(
    document.querySelector('#details')!, document.querySelector('#detail-drawer')!, frame.querySelector('.drawer-toggle')!,
  );
  let selected: AtlasSite | undefined;
  let scanTimer = 0;
  let locked = false;
  let scene: Awaited<ReturnType<typeof import('./atlas-scene').showAtlas>> | undefined;
  function select(siteId: string, fromGlobe: boolean) {
    const site = sites.find(item => item.id === siteId);
    if (!site) return;
    selected = site;
    locked=false;clearTimeout(scanTimer);
    frame.classList.remove('scanning');delete frame.dataset.siteLocked;
    const scanButton=document.querySelector<HTMLButtonElement>('#scan-site')!;
    scanButton.disabled=false;scanButton.hidden=false;scanButton.textContent='Scan site';
    document.querySelector('#deploy-surface')!.setAttribute('hidden','');
    document.querySelector('#descent-controls')!.removeAttribute('hidden');
    document.querySelector('#site-lock-status')!.textContent='Site selected. Scan to lock the descent coordinates.';
    scene?.focus(site.id);
    context.selection = site.id;
    context.subject = site.name;
    detail.hidden = false;
    document.querySelector('#details')!.classList.add('has-site');
    detail.innerHTML = `<p class="coordinates">${site.coordinates}</p><p>${site.detail}</p>
      ${routeLink(site.exhibit, 'Hardware record', 'quiet-link', true)}`;
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-site-control]')) {
      button.setAttribute('aria-expanded', String(button.dataset.siteControl === site.id));
    }
    if (!fromGlobe) return;
    if (!matchMedia('(max-width: 900px)').matches) return;
    const immediate = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(openDrawer, immediate ? 0 : 680);
  }
  if(odyssey){
    const button=document.querySelector<HTMLButtonElement>('[data-site-control]')!;
    button.dataset.siteControl='perseverance';button.innerHTML=icon('scan',18)+'<span>Lost transmission<small>Locate the recovery zone</small></span>'+icon('arrow',16);
  }
  document.querySelector('#scan-site')!.addEventListener('click',()=>{
    if(!selected)return;
    const button=document.querySelector<HTMLButtonElement>('#scan-site')!;button.disabled=true;button.textContent='Scanning…';
    frame.classList.add('scanning');
    scanTimer=window.setTimeout(()=>{
      locked=true;frame.classList.remove('scanning');button.hidden=true;
      document.querySelector('#site-lock-status')!.textContent='Coordinates locked. Surface deployment ready.';
      document.querySelector('#deploy-surface')!.removeAttribute('hidden');
      frame.dataset.siteLocked=selected!.id;
    },matchMedia('(prefers-reduced-motion: reduce)').matches?0:1250);
  });
  document.querySelector('#deploy-surface')!.addEventListener('click',()=>{
    if(!locked||!selected)return;
    (document.querySelector('#deploy-surface') as HTMLButtonElement).disabled=true;
    scene?.descend(selected.id);
    document.body.classList.add('descending');
    document.querySelector('#site-lock-status')!.textContent='Deploying Astra…';
    window.setTimeout(()=>{location.href=odyssey?routeLinkHref('story')+'?deploy=perseverance':routeLinkHref(id)+'?surface='+selected!.id;},matchMedia('(prefers-reduced-motion: reduce)').matches?0:950);
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-site-control]')) {
    button.addEventListener('click', () => select(button.dataset.siteControl!, false));
  }
  import('./atlas-scene').then(async module => {
    scene = await module.showAtlas(frame, id, sites, site => select(site, true));
    showLoaded(frame);
    if (selected) scene.focus(selected.id);
  }).catch(() => showFallback(frame));
}

export function compareWorlds() {
  return `<article class="shell">
    ${atlasBar('compare')}
    <div class="overview-heading"><h1>Moon and Mars</h1><p>Compare the surfaces that crews and rovers have to cross.</p></div>
    <div class="comparison-grid">
      <section class="panel gravity-chart">
        <h2>Surface gravity</h2><p>Relative to Earth</p>
        ${[['Earth',100],['Moon',destinations.moon.gravity],['Mars',destinations.mars.gravity]].map(([name,value]) =>
          `<div class="gravity-row"><span>${name}</span><div class="gravity-track" aria-hidden="true"><i style="--level:${value}%"></i></div><strong class="coordinates">${value}%</strong></div>`).join('')}
        ${sourceLink(sources.archive,'NASA Data Archive')}
      </section>
      <section class="panel comparison-table">
        <h2>Surface conditions</h2>
        <table><thead><tr><th scope="col">Condition</th><th scope="col">Moon</th><th scope="col">Mars</th></tr></thead>
          <tbody>${destinations.moon.facts.map(([fact, value], i) =>
            `<tr><th scope="row">${fact}</th><td>${value}</td><td>${destinations.mars.facts[i][1]}</td></tr>`).join('')}</tbody></table>
      </section>
    </div>
  </article>`;
}

export function photo(entry: typeof evidence.panorama) {
  return `<figure class="photo"><img loading="lazy" src="${asset(entry.image)}" alt="${entry.alt}"><figcaption>
    <h3>${entry.title}</h3><p>${entry.body}</p>${sourceLink(entry.url, entry.credit)}</figcaption></figure>`;
}

export function hardwareExhibit(id: HardwareId) {
  const exhibit = exhibits[id], moon = id === 'lunar';
  return `<article class="shell hardware ${moon ? 'moon' : 'mars'}">
    ${atlasBar()}
    <div class="survey-grid">
      <section class="view-frame hardware-frame" aria-label="${exhibit.name} model">
        <div class="model-canvas">${modelFallback((moon ? 'lunar' : 'opportunity') + '-illustration.jpg',
          moon ? 'The Apollo rover with four wire mesh wheels, two seats, and a dish antenna'
            : 'Opportunity’s six-wheel rover with its solar deck, raised camera mast, and front instrument arm')}</div>
        <header class="view-title">${routeLink(exhibit.world, '← ' + destinations[exhibit.world].name, 'back-link')}
          <h1>${exhibit.name}</h1><p>${exhibit.designation}</p>
        </header>
        <div class="view-bottom">${viewButtons()}
          <button class="button drawer-toggle" type="button" aria-controls="detail-drawer" aria-expanded="false">${icon('sliders',18)} Components</button>
        </div>
      </section>
      <aside class="detail-rail" id="details">
        <section class="panel instrument-panel">
          <h2>Components</h2>
          <div class="instrument-list">${exhibit.instruments.map(part =>
            `<button class="item-control" type="button" data-instrument="${part.id}" aria-pressed="false">
              ${icon('scan',17)}<span>${part.name}</span>${icon('arrow',15)}</button>`).join('')}</div>
          <div class="component-detail" id="component-detail" aria-live="polite"><p>${exhibit.overview}</p></div>
        </section>
        <section class="panel model-credit"><h2>Model source</h2><p>${exhibit.modelCredit}</p>${sourceLink(exhibit.source, exhibit.sourceLabel)}</section>
      </aside>
    </div>
    <div class="view-note"><span>Drag to orbit. Scroll or pinch to zoom.</span></div>
    <button class="button archive-open" id="open-mission-record">Mission record ${icon('layers',16)}</button>
    <dialog class="archive-dialog" id="archive-records" aria-label="Mission record"><div class="dialog-bar"><strong>Mission record</strong><span data-chat-slot></span><button class="close" id="close-mission-record" aria-label="Close mission record">×</button></div><div id="record-content"></div></dialog>
    <section class="mission-record"><h2>Mission timeline</h2><ol class="timeline">
      ${exhibit.timeline.map(([date, title, body]) => `<li><time>${date}</time><h3>${title}</h3><p>${body}</p></li>`).join('')}
    </ol>${sourceLink(exhibit.source, exhibit.sourceLabel)}</section>
    ${moon ? `<section class="mission-record"><h2>Mission evidence</h2><div class="evidence">${photo(evidence.apollo)}</div></section>` : `<section class="mission-record"><h2>Mission evidence</h2><div class="evidence">${photo(evidence.panorama)}${photo(evidence.selfie)}</div>
      <div class="page-links">${routeLink('experiment', 'Dust and solar power', 'button primary', true)}</div></section>`}
    ${drawerMarkup('Component details')}
  </article>`;
}

export function mountExhibit(id: HardwareId, context: SolarisContext) {
  const frame = document.querySelector<HTMLElement>('.hardware-frame')!;
  const exhibit = exhibits[id];
  const component = document.querySelector<HTMLElement>('#component-detail')!;
  const record = document.querySelector<HTMLDialogElement>('#archive-records')!;
  const recordContent = record.querySelector('#record-content')!;
  for (const section of document.querySelectorAll('.hardware > .mission-record')) recordContent.append(section);
  document.querySelector('#open-mission-record')!.addEventListener('click',()=>record.showModal());
  document.querySelector('#close-mission-record')!.addEventListener('click',()=>record.close());
  const openDrawer = mountDrawer(
    document.querySelector('#details')!, document.querySelector('#detail-drawer')!, frame.querySelector('.drawer-toggle')!,
  );
  let selected = '';
  let scene: Awaited<ReturnType<typeof import('./archive-scene').showHardware>> | undefined;
  function select(instrumentId: string, fromModel: boolean) {
    const part = exhibit.instruments.find(item => item.id === instrumentId);
    if (!part) return;
    selected = part.id;
    scene?.select(part.id);
    context.selection = part.id;
    context.subject = part.name;
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-instrument]')) {
      button.setAttribute('aria-pressed', String(button.dataset.instrument === selected));
    }
    component.innerHTML = `<h3>${part.name}</h3><p>${part.detail}</p>${sourceLink(exhibit.source, exhibit.sourceLabel)}`;
    if (fromModel) openDrawer();
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-instrument]')) {
    button.addEventListener('click', () => select(button.dataset.instrument!, false));
  }
  import('./archive-scene').then(async module => {
    scene = await module.showHardware(frame, id, part => select(part, true));
    showLoaded(frame);
    if (selected) scene.select(selected);
  }).catch(() => showFallback(frame));
}

export function showLoaded(frame: HTMLElement) {
  frame.classList.add('view-ready');
  frame.querySelector<HTMLElement>('.model-fallback')!.hidden = true;
  frame.querySelector<HTMLElement>('.view-state')!.hidden = true;
  frame.querySelector<HTMLElement>('[data-view-actions]')!.hidden = false;
}

function showFallback(frame: HTMLElement) {
  frame.classList.add('view-fallback');
  frame.querySelector<HTMLElement>('.view-state')!.textContent = '3D unavailable. Showing illustration.';
}
