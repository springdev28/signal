import {expect,test} from '@playwright/test';
import {flyJourney} from '../scripts/flight-journey.mjs';
// This journey has a separate continuous video. Disable per-action trace screenshots
// so their capture cost does not interfere with held flight controls.
test.use({trace:'off'});

test('clues and separated flight scans carry locks through touchdown, recovery and assembly',async({page,isMobile})=>{
 test.setTimeout(420000);
 await flyJourney(page,{mobile:isMobile});
});

test('landing waits for interactive stabilization, pauses for Solaris and supports retry and untimed input',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('signal-flight-v1',JSON.stringify({version:1,phase:'approach',x:-13,z:13,heading:0,altitude:22,samples:[],history:[],contacts:{camera:{x:6,z:-12,uncertainty:2,locked:true},solar:{x:14,z:-8,uncertainty:2,locked:true},wheel:{x:9,z:-5,uncertainty:2,locked:true}}}));
 });
 await page.goto('./odyssey/');await page.locator('#land-ship').click();
 await expect(page.locator('#stabilize-descent')).toBeVisible();
 await page.getByRole('button',{name:'Solaris',exact:true}).click();
 const status=await page.locator('#landing-status').textContent();await page.waitForTimeout(6500);
 expect(await page.locator('#landing-status').textContent()).toBe(status);
 await page.getByRole('button',{name:'Close Solaris'}).click();
 await expect(page.locator('#retry-descent')).toBeVisible({timeout:12000});await page.locator('#retry-descent').click();
 await expect(page.locator('#stabilize-descent')).toBeVisible();await page.locator('#untimed-descent').click();
 await page.waitForTimeout(6500);await expect(page.locator('#stabilize-descent')).toBeVisible();await page.locator('#stabilize-descent').click();
 await expect(page.locator('#step-outside')).toBeEnabled({timeout:12000});
 await expect(page.locator('#flight-stage')).toHaveAttribute('data-hatch','1.00');
});

test('flight failure retains clue interpretation, radar and keyboard controls',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type:string,...args:unknown[]){if(type==='webgl'||type==='webgl2')return null;return (original as Function).apply(this,[type,...args]);} as typeof original;
 });
 await page.goto('./odyssey/');await expect(page.getByText('3D unavailable. The radar and flight controls remain active.')).toBeVisible();
 await page.locator('#start-survey').click();
 await page.locator('#flight-records').evaluate((el:HTMLDetailsElement)=>el.open=true);
 await page.locator('#search-region').selectOption('camera');await page.locator('#flight-records').evaluate((el:HTMLDetailsElement)=>el.open=false);
 await page.locator('#flight-scan').click();await expect(page.locator('#flight')).toHaveAttribute('data-scans','1');
 await page.locator('#flight-scan').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');await expect.poll(async()=>Number(await page.locator('#flight').getAttribute('data-heading'))).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});
