import { asset, link } from './catalog';
import { showLoaded } from './atlas-ui';
import { collectionHasRover } from './mission';
import { hasLunar } from './odyssey/state';
import { routeLink, viewButtons } from './ui';
export function collectionMarkup() {
 const collected=[...(collectionHasRover()?['opportunity'] as const:[]),...(hasLunar()?['lunar'] as const:[])];
 return `<article class="shell collection"><header class="overview-heading"><h1>My Collection</h1></header>${collected.length?collected.map(id=>`<div class="collection-showcase"><div class="survey-grid"><section class="view-frame hardware-frame collection-frame" data-artifact="${id}" aria-label="Reconstructed ${id==='lunar'?'lunar rover':'Opportunity'} model"><div class="model-canvas"><div class="model-fallback"><img src="${asset((id==='lunar'?'lunar':'opportunity')+'-illustration.jpg')}" alt="${id==='lunar'?'Lunar Roving Vehicle':'Opportunity rover'}"></div><p class="view-state" role="status">Loading 3D view…</p></div><header class="view-title"><h2>${id==='lunar'?'Lunar Roving Vehicle':'Opportunity'}</h2></header><div class="view-bottom">${viewButtons()}</div></section><aside class="detail-rail"><section class="panel"><h2>Reconstruction</h2><p>Three assemblies recovered and fitted in the fictional ${id==='lunar'?'Moon':'Mars'} expedition.</p><div class="page-links">${routeLink(id,'Open exhibit','button primary',true)}<a class="button outline" href="${link('story')}?chapter=${id==='lunar'?'moon':'mars'}&replay=1">New flight</a></div></section></aside></div></div>`).join(''):`<section class="panel empty-collection"><p>Your collection is empty. Complete an Odyssey reconstruction to add an artifact here.</p>${routeLink('story','Start mission','button primary',true)}</section>`}</article>`;
}
export function mountCollection(){
 for(const panel of document.querySelectorAll<HTMLElement>('.collection-frame'))import('./archive-scene').then(async module=>{await module.showHardware(panel,panel.dataset.artifact as 'opportunity'|'lunar',()=>{});showLoaded(panel);}).catch(()=>{panel.classList.add('view-fallback');panel.querySelector<HTMLElement>('.view-state')!.textContent='3D unavailable. Showing illustration.';});
}
