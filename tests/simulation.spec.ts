import { expect, test, type Page } from '@playwright/test';
import { walkTo } from './ground-navigation';

async function position(page:Page){return (await page.locator('#surface-stage').getAttribute('data-position'))!.split(',').map(Number);}


test('time simulation leads from orbit to a scanned Moon site and surface exploration',async({page,isMobile})=>{
  test.setTimeout(90000);
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&/Shader Error|VALIDATE_STATUS/.test(message.text()))errors.push(message.text());});
  await page.goto('./omnecarta/');
  const orbit=page.locator('.orbital-interface');
  await expect(page.locator('#orbital-space.view-ready canvas')).toBeVisible();
  await expect(orbit).toHaveAttribute('data-simulated-days','0.000');
  await page.getByLabel('Orbit speed').selectOption('32');
  await page.getByRole('button',{name:'Play orbits',exact:true}).press('Enter');
  await expect.poll(async()=>Number(await orbit.getAttribute('data-simulated-days'))).toBeGreaterThan(3);
  await page.getByRole('button',{name:'Pause orbits',exact:true}).click();
  const paused=await orbit.getAttribute('data-simulated-days');
  await page.waitForTimeout(200);
  await expect(orbit).toHaveAttribute('data-simulated-days',paused!);
  await page.getByRole('button',{name:'Reset simulation time'}).click();
  await expect(orbit).toHaveAttribute('data-simulated-days','0.000');
  await page.locator('[data-world="moon"]').press('Enter');
  await expect(page.locator('[data-world="moon"]')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('link',{name:'Approach Moon'}).click();
  await page.getByRole('button',{name:'Focus Apollo 15 on globe'}).click();
  await expect(page.getByRole('button',{name:'Deploy Astra'})).toBeHidden();
  await page.getByRole('button',{name:'Scan site',exact:true}).click();
  await expect(page.locator('.world-frame')).toHaveAttribute('data-site-locked','apollo15');
  await page.getByRole('button',{name:'Deploy Astra'}).click();
  await expect(page).toHaveURL(/moon\/\?surface=apollo15$/);
  const stage=page.locator('#surface-stage');
  await expect(stage.locator('canvas')).toBeVisible();
  await expect(stage).toHaveClass(/view-ready/);
  const rect=(await stage.boundingBox())!;
  expect(rect.width).toBe(page.viewportSize()!.width);expect(rect.height).toBe(page.viewportSize()!.height);
  await page.getByRole('button',{name:'Scan',exact:true}).click();
  await expect(page.locator('#surface-status')).toContainText('Move closer');
  await page.locator('.surface-map summary').click();
  await page.getByRole('combobox',{name:'Waypoint',exact:true}).selectOption('rover');
  await expect(page.locator('#surface-bearing')).toContainText('Lunar Roving Vehicle');
  await page.locator('.surface-map summary').click();
  await page.getByRole('button',{name:'Jump',exact:true}).click();
  await expect.poll(async()=>Number(await stage.getAttribute('data-altitude'))).toBeGreaterThan(.3);
  await walkTo(page,'#surface-stage',-11,-18,isMobile,.6);
  await page.getByRole('button',{name:'Scan',exact:true}).click();
  await expect(page.locator('#surface-find')).toContainText('Lunar Roving Vehicle');
  await expect(page.locator('#surface-status')).toHaveText('1 / 3 landmarks explored');
  const saved=await position(page);
  await page.reload();
  await expect(stage).toHaveAttribute('data-position',saved.map(value=>value.toFixed(2)).join(','));
  await page.getByRole('link',{name:'My Collection',exact:true}).first().click();
  await expect(page.getByText('Your collection is empty.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('surface gestures rotate and pinch without moving Astra, and a tap sets a walking destination',async({page,isMobile})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('./mars/?surface=eagle');
  const stage=page.locator('#surface-stage');await expect(stage).toHaveClass(/view-ready/);
  const before=await position(page),distance=await stage.getAttribute('data-camera-distance');
  const viewport=page.viewportSize()!,x=viewport.width*.45,y=viewport.height*.55;
  if(isMobile){
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-25,y},{x:x+25,y}]});
    for(let n=1;n<=5;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-25-n*5,y},{x:x+25+n*5,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await cdp.detach();
  }else{
    await page.mouse.move(x,y);await page.mouse.wheel(0,-220);
  }
  await expect(stage).not.toHaveAttribute('data-camera-distance',distance!);
  expect(await position(page)).toEqual(before);
  if(!isMobile){await page.getByRole('button',{name:'Reset camera',exact:true}).click();}
  // The ground is below the character and clear of every HUD panel.
  await page.mouse.click(viewport.width*.52,viewport.height*.72);
  await expect.poll(async()=>Math.hypot(...(await position(page)).map((v,i)=>v-before[i]))).toBeGreaterThan(.25);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
});

test('a WebGL failure retains an accessible route back from the surface',async({page})=>{
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type:string,...args:unknown[]){
      if(type==='webgl'||type==='webgl2')return null;
      return (original as Function).apply(this,[type,...args]);
    } as typeof original;
  });
  await page.goto('./moon/?surface=apollo15');
  await expect(page.getByText('3D exploration needs WebGL.')).toBeVisible();
  await expect(page.locator('.surface-fallback')).toBeVisible();
  await page.getByRole('link',{name:'Return to the atlas'}).click();
  await expect(page).toHaveURL(/moon\/$/);
});
