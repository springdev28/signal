import { expect, test } from '@playwright/test';

test('movement follows a rotated camera and settles after releasing input',async({page,isMobile})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('./mars/?surface=eagle');
  const stage=page.locator('#surface-stage');
  await expect(stage).toHaveClass(/view-ready/);
  const viewport=page.viewportSize()!;
  const x=viewport.width*.5,y=viewport.height*.54;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+90,y,{steps:8});await page.mouse.up();
  await page.waitForTimeout(450);
  const before=(await stage.getAttribute('data-position'))!.split(',').map(Number);
  const heading=Number(await stage.getAttribute('data-camera-heading'));
  const button=page.getByRole('button',{name:'Move forward',exact:true});
  let cdp;
  if(isMobile){
    cdp=await page.context().newCDPSession(page);
    const box=(await button.boundingBox())!;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
  }else{await stage.locator('canvas').focus();await page.keyboard.down('w');}
  await expect.poll(async()=>Number(await stage.getAttribute('data-speed'))).toBeGreaterThan(2.5);
  if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else await page.keyboard.up('w');
  await expect.poll(async()=>Number(await stage.getAttribute('data-speed'))).toBe(0);
  const after=(await stage.getAttribute('data-position'))!.split(',').map(Number);
  const dx=after[0]-before[0],dz=after[1]-before[1],distance=Math.hypot(dx,dz);
  expect(distance).toBeGreaterThan(.2);
  expect((dx*-Math.sin(heading)+dz*-Math.cos(heading))/distance).toBeGreaterThan(.97);
  await page.waitForTimeout(180);
  expect((await stage.getAttribute('data-position'))!.split(',').map(Number)).toEqual(after);
});

test('the map is optional, controls remain reachable, and reduced motion is honored',async({page})=>{
  await page.setViewportSize({width:320,height:640});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('./mars/?surface=eagle');
  await expect(page.locator('#surface-stage')).toHaveClass(/view-ready/);
  await expect(page.locator('.surface-map')).not.toHaveAttribute('open','');
  await expect(page.getByRole('combobox',{name:'Waypoint',exact:true})).toBeHidden();
  await page.locator('.surface-map summary').click();
  await expect(page.getByRole('combobox',{name:'Waypoint',exact:true})).toBeVisible();
  await page.locator('.surface-map summary').click();
  for(const name of ['Move forward','Move backward','Move left','Move right','Scan','Jump']){
    const box=(await page.getByRole('button',{name,exact:true}).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(640);
  }
  const duration=await page.locator('#surface-stage canvas').evaluate(el=>getComputedStyle(el).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(.001);
});
