import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/barlow-condensed/latin-600.css';
import './tokens.css';
import './style.css';
import './story.css';
import './simulation.css';
import './tech-interface.css';
import './flight.css';
import './celestial-art.css';
import './experience.css';
import './gameplay.css';
import './brand.css';
import { base, destinations, exhibits, link, paths, sources, type Page } from './catalog';
import { atlasWorld, compareWorlds, hardwareExhibit, mountExhibit, mountWorld } from './atlas-ui';
import { experimentMarkup, mountExperiment } from './experiment';
import { mountSolaris, solarisMarkup, type SolarisContext } from './solaris';
import { icon, mountNavigationMotion, routeLink, sourceLink } from './ui';
import { orbitMarkup, mountOrbits } from './orbits';
import { loadStory, saveStory, startStory } from './mission';
import { resetFlight } from './flight-state';
import { surfaceMarkup, mountSurface } from './surface';

const pathname = location.pathname.slice(base.length).replace(/(?:index\.html)?\/?$/, '');
const page: Page = pathname === 'story' ? 'story'
  : (Object.keys(paths) as Page[]).find(key => paths[key].replace(/\/$/, '') === pathname) ?? 'home';

const labels: Record<Page,string> = {
  home: '>_signal', atlas: 'Omnecarta', moon: destinations.moon.name, mars: destinations.mars.name,
  compare: 'Moon and Mars', opportunity: exhibits.opportunity.name, lunar: exhibits.lunar.name,
  experiment: 'Dust and solar power', story: 'Odyssey', collection: 'My Collection',
};
const context: SolarisContext = { view: page, subject: labels[page] };
const query = new URLSearchParams(location.search);
if(page==='story'&&query.has('replay')){
  saveStory(startStory());
  resetFlight();
  if(query.get('chapter')!=='moon')history.replaceState(null,'',location.pathname+'?replay=1');
}
const surface = (page === 'moon' || page === 'mars') && query.has('surface');
const orbital = page === 'home' || page === 'atlas';
const flight=page==='story'&&!query.has('deploy')&&loadStory().phase==='briefing';
document.body.dataset.interface = page==='story'?'playcanvas':orbital ? 'orbit' : surface ? 'surface' : ['moon','mars'].includes(page) ? 'world' : ['opportunity','lunar','collection'].includes(page) ? 'hardware' : 'reading';
const app = document.querySelector<HTMLDivElement>('#app')!;
const wordmark = `<a class="wordmark" href="${link('home')}" aria-label=">_signal home"><img class="brand-art" src="${base}brand/signal-wordmark.svg" alt="" width="274" height="76"></a>`;

const explore = `<div class="explore-menu" id="explore-menu">
  <button id="explore" class="explore-trigger" type="button" aria-expanded="false" aria-controls="explore-links">Explore ${icon('down',16)}</button>
  <div class="explore-links" id="explore-links" hidden>
    ${routeLink('atlas',icon('circle',18) + 'Omni-View')}
    ${routeLink('story',icon('scan',18) + 'Odyssey')}
  </div></div>`;

async function content() {
  if (orbital) return orbitMarkup(false, page === 'home');
  if (surface) return surfaceMarkup(page as 'moon' | 'mars');
  switch (page) {
    case 'moon': case 'mars': return atlasWorld(page);
    case 'compare': return compareWorlds();
    case 'opportunity': case 'lunar': return hardwareExhibit(page);
    case 'experiment': return experimentMarkup();
    case 'collection': return (await import('./collection')).collectionMarkup();
    case 'story': return (await import('./odyssey/game')).odysseyMarkup();
  }
}

document.title = page === 'home' ? '>_signal' : `${labels[page]} · >_signal`;
app.innerHTML = `<a class="skip" href="#main">Skip to content</a>
  <header class="topbar">${wordmark}${page==='story'?'<button class="game-menu-toggle" aria-expanded="false" aria-controls="game-nav">Menu</button>':''}<nav id="game-nav" aria-label="Main navigation">
  ${explore}
  <a class="collection-link" href="${link('collection')}" aria-label="My Collection" ${page==='collection'?'aria-current="page"':''}>
  ${icon('box',18)}<span><span class="collection-full">My </span>Collection</span></a></nav>
  <button class="solaris-trigger" type="button" data-open-solaris aria-label="Solaris" aria-haspopup="dialog" aria-expanded="false">${icon('solaris',19)} <span>Solaris</span></button></header>
  <main id="main" tabindex="-1">${await content()}</main>
  <footer class="footer">${wordmark}${sourceLink(sources.archive,'NASA Data Archive')}</footer>
  ${solarisMarkup()}`;

// Keep drawers and anchor targets clear of the header when navigation wraps.
const header = document.querySelector<HTMLElement>('.topbar')!;
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
}).observe(header);

const menu = document.querySelector<HTMLElement>('#explore-menu')!;
const trigger = document.querySelector<HTMLButtonElement>('#explore')!;
const menuLinks = document.querySelector<HTMLElement>('#explore-links')!;
function toggleMenu(open: boolean) {
  menuLinks.hidden = !open;
  trigger.setAttribute('aria-expanded', String(open));
}
trigger.addEventListener('click', () => toggleMenu(menuLinks.hasAttribute('hidden')));
menu.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menuLinks.hidden) {
    event.preventDefault();
    toggleMenu(false);
    trigger.focus();
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const links = Array.from(menuLinks.querySelectorAll<HTMLAnchorElement>('a'));
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    toggleMenu(true);
    const next = event.key === 'ArrowDown' ? (index + 1) % links.length : index <= 0 ? links.length - 1 : index - 1;
    links[next].focus();
  }
});
document.addEventListener('click', event => {
  if (!menu.contains(event.target as Node)) toggleMenu(false);
});
menu.addEventListener('focusout', event => {
  if (!menu.contains(event.relatedTarget as Node | null)) toggleMenu(false);
});

mountSolaris(context);
mountNavigationMotion();
if (orbital) {
  mountOrbits(context, false).catch(() => {
    document.querySelector('#orbital-space .view-state')!.textContent = 'Orbital view unavailable. Choose Moon or Mars below.';
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-world]')) button.addEventListener('click', () => { location.href = link(button.dataset.world as 'moon' | 'mars'); });
  });
} else if (surface) {
  mountSurface(page as 'moon' | 'mars', context);
} else switch (page) {
  case 'moon': case 'mars': mountWorld(page, context); break;
  case 'opportunity': case 'lunar': mountExhibit(page, context); break;
  case 'experiment': mountExperiment(context); break;
  case 'story':
    await (await import('./odyssey/game')).mountOdyssey(context);
    break;
  case 'collection': (await import('./collection')).mountCollection(); break;
}

const gameMenu=document.querySelector<HTMLButtonElement>('.game-menu-toggle');
gameMenu?.addEventListener('click',()=>{const open=gameMenu.getAttribute('aria-expanded')!=='true';gameMenu.setAttribute('aria-expanded',String(open));document.querySelector('.topbar')!.classList.toggle('game-menu-open',open);});
