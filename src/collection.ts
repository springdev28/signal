import { asset, link } from './catalog';
import { showLoaded } from './atlas-ui';
import { collectionHasRover, missionSite } from './mission';
import { routeLink, viewButtons } from './ui';

export function collectionMarkup() {
  return `<article class="shell collection">
    <header class="overview-heading"><h1>My Collection</h1></header>
    ${collectionHasRover() ? `<div class="collection-showcase">
      <div class="survey-grid">
        <section class="view-frame hardware-frame collection-frame" aria-label="Reconstructed Opportunity model">
          <div class="model-canvas"><div class="model-fallback"><img src="${asset('opportunity-illustration.jpg')}" alt="Reconstructed Opportunity rover"></div>
            <p class="view-state" role="status">Loading 3D view…</p></div>
          <header class="view-title"><h2>Opportunity</h2></header><div class="view-bottom">${viewButtons()}</div>
        </section>
        <aside class="detail-rail"><section class="panel">
          <h2>Reconstruction</h2><p>All three assemblies fitted in the fictional ${missionSite.name} mission.</p>
          <div class="page-links">${routeLink('opportunity','Open Exhibit','button primary',true)}
          <a class="button outline" href="${link('story')}?replay=1">Replay Story</a></div>
        </section></aside>
      </div>
    </div>` : `<section class="panel empty-collection"><p>Your collection is empty. Finish the Opportunity reconstruction to add it here.</p>
      ${routeLink('story','Start mission','button primary',true)}</section>`}
  </article>`;
}

export function mountCollection() {
  const panel = document.querySelector<HTMLElement>('.collection-frame');
  if (!panel) return;
  import('./archive-scene').then(async module => {
    await module.showHardware(panel, 'opportunity', () => {});
    showLoaded(panel);
  }).catch(() => {
    panel.classList.add('view-fallback');
    panel.querySelector<HTMLElement>('.view-state')!.textContent = '3D unavailable. Showing illustration.';
  });
}
