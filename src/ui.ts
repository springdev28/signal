import { link, type Page } from './catalog';

const paths = {
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm9 9-9 5-9-5m18 4-9 5-9-5"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9v9m8-13.5L12 12 4 7.5"/>',
  solaris: '<path d="M2 12c4-6 16-6 20 0-4 6-16 6-20 0Z"/><circle cx="12" cy="12" r="3"/><path d="m8 19 8-14"/>',
  left: '<path d="M9 5 3 11l6 6m-6-6h13a4 4 0 0 1 0 8"/>',
  right: '<path d="m15 5 6 6-6 6m6-6H8a4 4 0 0 0 0 8"/>',
  up: '<path d="m6 10 6-6 6 6m-6-6v16"/>',
  lower: '<path d="m6 14 6 6 6-6m-6 6V4"/>',
  plus: '<path d="M5 12h14m-7-7v14"/>',
  minus: '<path d="M5 12h14"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8m-2-8V4m0 6h6"/>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/>',
  circle: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c4 3 4 13 0 16m0-16c-4 3-4 13 0 16"/>',
  sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 3v6m8 0v6m-5 0v6"/>',
  scan: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  expand: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
} as const;

export const icon = (name: keyof typeof paths, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;

export const routeLink = (page: Page, label: string, classes = '', arrow = false) =>
  `<a class="${classes}" href="${link(page)}">${label}${arrow ? icon('arrow',16) : ''}</a>`;

export const sourceLink = (url: string, label: string) =>
  `<a class="source" href="${url}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`;

export const viewButtons = (vertical = false) => `<div class="view-actions" aria-label="Camera controls" data-view-actions hidden>
  <button type="button" data-view="left" aria-label="Rotate left" title="Rotate left">${icon('left')}</button>
  <button type="button" data-view="right" aria-label="Rotate right" title="Rotate right">${icon('right')}</button>
  ${vertical ? `<button type="button" data-view="up" aria-label="Orbit up" title="Orbit up">${icon('up')}</button>
  <button type="button" data-view="down" aria-label="Orbit down" title="Orbit down">${icon('lower')}</button>` : ''}
  <button type="button" data-view="out" aria-label="Zoom out" title="Zoom out">${icon('minus')}</button>
  <button type="button" data-view="in" aria-label="Zoom in" title="Zoom in">${icon('plus')}</button>
  <button type="button" data-view="reset" aria-label="Reset view" title="Reset view">${icon('reset')}</button>
</div>`;

export function mountDrawer(panel: HTMLElement, drawer: HTMLDialogElement, button: HTMLButtonElement, modal = true) {
  const slot = drawer.querySelector<HTMLElement>('[data-drawer-body]')!;
  const anchor = document.createComment('details panel');
  panel.before(anchor);
  function open() {
    if (getComputedStyle(button).display === 'none' || drawer.open) return;
    slot.append(panel);
    if(modal)drawer.showModal();else drawer.show();
    button.setAttribute('aria-expanded', 'true');
  }
  button.addEventListener('click', open);
  drawer.querySelector('button[data-close-drawer]')!.addEventListener('click', () => drawer.close());
  drawer.addEventListener('close', () => {
    anchor.after(panel);
    button.setAttribute('aria-expanded', 'false');
    button.focus();
  });
  matchMedia('(max-width: 900px)').addEventListener('change', event => {
    if (!event.matches && drawer.open) drawer.close();
  });
  return open;
}

export const drawerMarkup = (label: string) => `<dialog class="drawer" id="detail-drawer" aria-label="${label}">
  <div class="dialog-bar"><strong>${label}</strong><span data-chat-slot></span><button type="button" data-close-drawer class="close" aria-label="Close details">×</button></div>
  <div data-drawer-body></div>
</dialog>`;

/** A short same-origin handoff also works when cross-document view transitions
 * are unavailable. Modified clicks and external destinations stay native. */
export function mountNavigationMotion(){
  let leaving=false;
  window.addEventListener('pageshow',()=>{leaving=false;document.body.classList.remove('scene-leaving');});
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const anchor=(event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if(!anchor||anchor.target||anchor.hasAttribute('download'))return;
    const next=new URL(anchor.href);
    if(next.origin!==location.origin||(next.pathname===location.pathname&&next.search===location.search&&next.hash))return;
    event.preventDefault();if(leaving)return;
    leaving=true;document.body.classList.add('scene-leaving');
    setTimeout(()=>location.assign(next.href),160);
  });
}
