import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import './tokens.css';
import './style.css';
import './story.css';
import { asset, base, destinations, exhibits, link, paths, sources, type Page } from './catalog';
import { atlasOverview, atlasWorld, compareWorlds, hardwareExhibit, mountExhibit, mountWorld } from './atlas-ui';
import { experimentMarkup, mountExperiment } from './experiment';
import { mountSolaris, solarisMarkup, type SolarisContext } from './solaris';
import { icon, routeLink, sourceLink } from './ui';

const pathname = location.pathname.slice(base.length).replace(/(?:index\.html)?\/?$/, '');
const page: Page = pathname === 'story' ? 'story'
  : (Object.keys(paths) as Page[]).find(key => paths[key].replace(/\/$/, '') === pathname) ?? 'home';

const labels: Record<Page,string> = {
  home: '>_signal', atlas: 'Omnecarta', moon: destinations.moon.name, mars: destinations.mars.name,
  compare: 'Moon and Mars', opportunity: exhibits.opportunity.name, lunar: exhibits.lunar.name,
  experiment: 'Dust and solar power', story: 'Odyssey', collection: 'My Collection',
};
const context: SolarisContext = { view: page, subject: labels[page] };
const app = document.querySelector<HTMLDivElement>('#app')!;
const wordmark = `<a class="wordmark" href="${link('home')}" aria-label=">_signal home"><span>&gt;_</span>signal</a>`;

const explore = `<div class="explore-menu" id="explore-menu">
  <button id="explore" class="explore-trigger ${page === 'home' ? 'button primary' : ''}" type="button" aria-expanded="false" aria-controls="explore-links">Explore ${icon('down',16)}</button>
  <div class="explore-links" id="explore-links" hidden>
    ${routeLink('atlas',icon('circle',18) + 'Omni-View')}
    ${routeLink('story',icon('scan',18) + 'Odyssey')}
  </div></div>`;

function home() {
  return `<section class="home" style="--horizon:url('${asset('crater-horizon.jpg')}')">
    <div class="home-copy">
      <h1><span>&gt;_</span>signal</h1>
      <p>Survey the Moon and Mars. Follow the traces left by their explorers, then help Astra recover what remains.</p>
      ${explore}
    </div>
    <figure class="home-art">
      <img src="${asset('astra-portrait.png')}" alt="Astra, a draped explorer with a binocular head, two antennae, and a curled cable">
      <figcaption>Astra</figcaption>
    </figure>
  </section>`;
}

async function content() {
  switch (page) {
    case 'home': return home();
    case 'atlas': return atlasOverview();
    case 'moon': case 'mars': return atlasWorld(page);
    case 'compare': return compareWorlds();
    case 'opportunity': case 'lunar': return hardwareExhibit(page);
    case 'experiment': return experimentMarkup();
    case 'collection': return (await import('./collection')).collectionMarkup();
    case 'story': return (await import('./story')).storyMarkup();
  }
}

document.title = page === 'home' ? '>_signal' : `${labels[page]} · >_signal`;
app.innerHTML = `<a class="skip" href="#main">Skip to content</a>
  <header class="topbar">${wordmark}<nav aria-label="Main navigation">
  ${page === 'home' ? '' : explore}
  <a class="collection-link" href="${link('collection')}" aria-label="My Collection" ${page==='collection'?'aria-current="page"':''}>
  ${icon('box',18)}<span><span class="collection-full">My </span>Collection</span></a></nav>
  <button class="solaris-trigger" type="button" data-open-solaris aria-haspopup="dialog" aria-expanded="false">${icon('solaris',19)} Solaris</button></header>
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
switch (page) {
  case 'moon': case 'mars': mountWorld(page, context); break;
  case 'opportunity': case 'lunar': mountExhibit(page, context); break;
  case 'experiment': mountExperiment(context); break;
  case 'story': (await import('./story')).mountStory(context); break;
  case 'collection': (await import('./collection')).mountCollection(); break;
}
