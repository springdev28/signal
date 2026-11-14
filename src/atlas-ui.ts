import { asset, link as routeLinkHref, destinations, exhibits, evidence, sources, type AtlasSite, type HardwareId, type Page, type WorldId } from './catalog';
import { drawerMarkup, icon, mountDrawer, routeLink, sourceLink, viewButtons } from './ui';
import type { SolarisContext } from './solaris';

const names = { atlas: 'Omnecarta', moon: 'Moon', mars: 'Mars', compare: 'Compare' } as const;

export function atlasBar(active?: Page) {
  return `<div class="atlas-bar">
    <a class="atlas-brand" href="${routeLinkHref('atlas')}">${icon('layers',19)} <span>Omnecarta</span></a>
    <nav class="atlas-tabs" aria-label="Atlas navigation">
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
        <header class="view-title"><h1>${world.name}</h1><p>${world.kind}</p></header>
        <div class="view-bottom"><span class="coordinates" data-coordinates aria-label="View center">—</span>${viewButtons(true)}
          <button class="button drawer-toggle" type="button" aria-controls="detail-drawer" aria-expanded="false">${icon('sliders',18)} Details</button>
        </div>
      </section>
      <aside class="detail-rail" id="details">
        <section class="panel fact-panel">
          <h2>Surface facts</h2><p class="world-intro">${world.intro}</p>
          <dl>${world.facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
          ${sourceLink(sources.archive, 'NASA Data Archive')}
        </section>
        <section class="panel site-panel">
          <h2>Mission site</h2>
          ${world.sites.map(site => `<button type="button" class="item-control" data-site-control="${site.id}" aria-expanded="false">
            ${icon('pin',18)}<span>${site.mission}<small>${site.name}</small></span>${icon('arrow',16)}
          </button>`).join('')}
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
  const frame = document.querySelector<HTMLElement>('.world-frame')!;
  const detail = document.querySelector<HTMLElement>('#site-detail')!;
  const openDrawer = mountDrawer(
    document.querySelector('#details')!, document.querySelector('#detail-drawer')!, frame.querySelector('.drawer-toggle')!,
  );
  let selected: AtlasSite | undefined;
  let scene: Awaited<ReturnType<typeof import('./atlas-scene').showAtlas>> | undefined;
  function select(siteId: string, fromGlobe: boolean) {
    const site = world.sites.find(item => item.id === siteId);
    if (!site) return;
    selected = site;
    scene?.focus(site.id);
    context.selection = site.id;
    context.subject = site.name;
    detail.hidden = false;
    document.querySelector('#details')!.classList.add('has-site');
    detail.innerHTML = `<p class="coordinates">${site.coordinates}</p><p>${site.detail}</p>
      ${routeLink(site.exhibit, exhibits[site.exhibit].name, 'button primary', true)}`;
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-site-control]')) {
      button.setAttribute('aria-expanded', String(button.dataset.siteControl === site.id));
    }
    if (!fromGlobe) return;
    if (!matchMedia('(max-width: 900px)').matches) return;
    const immediate = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(openDrawer, immediate ? 0 : 680);
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-site-control]')) {
    button.addEventListener('click', () => select(button.dataset.siteControl!, false));
  }
  import('./atlas-scene').then(async module => {
    scene = await module.showAtlas(frame, id, world.sites, site => select(site, true));
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
