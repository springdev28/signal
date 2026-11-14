import {test,expect} from '@playwright/test';
import {fresh} from '../src/odyssey/state';
test.use({trace:'off'});
test('fresh cockpit accepts steering, throttle, scans and a lock without a record',async({page,isMobile})=>{
 test.setTimeout(100000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./odyssey/?replay=1');const root=page.locator('#pc-odyssey');await expect(root).toHaveAttribute('data-ready','true',{timeout:60000});
 await page.locator('#pc-scan').click();await expect(root).toHaveAttribute('data-scans','3');
 if(isMobile){
  const cdp=await page.context().newCDPSession(page);const lever=(await page.locator('#pc-throttle').boundingBox())!;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:lever.x+lever.width/2,y:lever.y+lever.height*.8}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:lever.x+lever.width/2,y:lever.y+lever.height*.12}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const r=(await page.getByRole('button',{name:'Steer right',exact:true}).boundingBox())!;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});await page.waitForTimeout(500);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else{await page.locator('#pc-canvas').focus();await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForTimeout(600);await page.keyboard.up('d');await page.waitForTimeout(900);await page.keyboard.up('w');}
 await expect.poll(async()=>Number(await root.getAttribute('data-heading')),{timeout:10000}).toBeGreaterThan(8);
 await expect.poll(async()=>{const p=(await root.getAttribute('data-position'))!.split(',').map(Number);return Math.hypot(p[0],p[1]-74);},{timeout:30000}).toBeGreaterThan(36);
 await page.locator('#pc-canvas').focus();await page.keyboard.press('Space');await expect.poll(async()=>Number(await root.getAttribute('data-speed'))).toBeLessThan(1);
 await page.locator('#pc-scan').click();await expect(root).toHaveAttribute('data-scans','6');await page.locator('#pc-lock').click();await expect(root).toHaveAttribute('data-locks','1');expect(await page.locator('#pc-record').evaluate((e:HTMLDialogElement)=>e.open)).toBe(false);
 for(const id of ['#pc-scan','#pc-lock','#pc-throttle']){const b=(await page.locator(id).boundingBox())!;expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(page.viewportSize()!.width);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);expect(errors).toEqual([]);
});
test('touchdown pauses for Solaris and supports retry and untimed stabilization',async({page})=>{
 test.setTimeout(95000);const s=fresh('mars');Object.assign(s,{stage:'approach',x:0,z:-83,altitude:8});s.contacts.forEach(c=>{c.locked=true;c.radius=2;c.samples=[{x:0,z:74},{x:25,z:35}];});await page.addInitScript(s=>localStorage.setItem('signal-pc-odyssey-v2-mars',JSON.stringify(s)),s);
 await page.goto('./odyssey/');await expect(page.locator('#pc-odyssey')).toHaveAttribute('data-ready','true',{timeout:60000});await page.locator('#pc-interact').click();await page.getByRole('button',{name:'Solaris',exact:true}).click();await page.waitForTimeout(6500);await page.getByRole('button',{name:'Close Solaris'}).click();await expect(page.locator('#pc-stabilize')).toBeVisible();await expect(page.locator('#pc-retry')).toBeVisible({timeout:15000});await page.locator('#pc-retry').click();await page.locator('#pc-untimed').click();await page.waitForTimeout(7500);await expect(page.locator('#pc-stabilize')).toBeVisible();await page.locator('#pc-stabilize').click();await expect(page.locator('#pc-odyssey')).toHaveAttribute('data-stage','landed');
});
test('mission library is free to browse and has same-object model fallback',async({page})=>{
 await page.route('**/models/nasa/apollo.glb',route=>route.abort());await page.goto('./omnecarta/?resource=apollo');await expect(page.locator('.library-view')).toHaveAttribute('data-fallback','true');await expect(page.locator('#library-fallback')).toBeVisible();expect(await page.locator('#library-fallback').evaluate((i:HTMLImageElement)=>i.naturalWidth)).toBeGreaterThan(100);await expect(page.locator('#library-select option')).toHaveCount(13);expect(await page.evaluate(()=>localStorage.getItem('signal-pc-collection-v1'))).toBeNull();
});
