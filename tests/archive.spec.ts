import { expect, test } from '@playwright/test';

const approved = new Set([
  'https://nssdc.gsfc.nasa.gov/',
  'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
  'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
  'https://science.nasa.gov/mission/viking-1/',
]);

test('Explore opens two choices and the atlas is available before playing', async ({ page, isMobile }) => {
  await page.goto('./');
  await expect(page.getByRole('heading',{name:'>_signal',exact:true})).toBeVisible();
  const explore = page.getByRole('button',{name:'Explore',exact:true});
  if (isMobile) await explore.tap();
  else await explore.press('ArrowDown');
  const choices = page.locator('#explore-links').getByRole('link');
  await expect(choices).toHaveText(['Omni-View','Odyssey']);
  if (isMobile) await choices.first().tap();
  else await choices.first().press('Enter');
  await expect(page).toHaveURL(/omnecarta\/$/);
  await page.getByRole('main').getByRole('link',{name:/^Moon Earth/}).click();
  await expect(page.getByRole('heading',{name:'Moon',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Mars',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Mars',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Compare',exact:true}).click();
  await expect(page.getByRole('table')).toContainText('38%');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.goto('./opportunity/');
  await expect(page.getByRole('heading',{name:'Opportunity',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'My Collection',exact:true}).first().click();
  await expect(page.getByText(/Your collection is empty/)).toBeVisible();
});

test('Apollo 15 focus uses the right coordinates and the far-side pin is hidden', async ({ page, isMobile }) => {
  await page.goto('./moon/');
  await expect(page.locator('.world-frame.view-ready canvas')).toBeVisible();
  const marker = page.getByRole('button',{name:'Focus Apollo 15 on globe'});
  await expect(marker).toBeVisible();
  const coordinates = page.locator('[data-coordinates]');
  await expect(coordinates).toHaveText('10.0° N · 8.0° W');
  if (isMobile) await marker.tap();
  else await marker.press('Enter');
  await expect(coordinates).toHaveText('26.1° N · 3.6° E');
  if (isMobile) {
    const drawer = page.getByRole('dialog',{name:'World details'});
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('26.132° N · 3.633° E')).toBeVisible();
    await drawer.getByRole('button',{name:'Close details'}).tap();
  } else {
    await expect(page.locator('#site-detail')).toContainText('Hadley Rille');
  }
  const rotate = page.getByRole('button',{name:'Rotate left'});
  for(let i=0;i<7;i++) await rotate.press('Enter');
  await expect(marker).toBeHidden();
  await page.getByRole('button',{name:'Reset view'}).press('Enter');
  await expect(coordinates).toHaveText('10.0° N · 8.0° W');
  await expect(marker).toBeVisible();

  if (isMobile) {
    const canvas=page.locator('.world-frame canvas');
    await canvas.scrollIntoViewIfNeeded();
    const rect=(await canvas.boundingBox())!;
    const cdp=await page.context().newCDPSession(page);
    const y=rect.y+rect.height*.54, x=rect.x+rect.width*.54;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let step=1;step<=6;step++){
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-step*9,y}]});
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect(coordinates).not.toHaveText('10.0° N · 8.0° W');
    await cdp.detach();
  }
  await page.reload();
  await expect(page.getByRole('heading',{name:'Moon',exact:true})).toBeVisible();
});

test('rover model rotation, part highlight, and approved links', async ({page,isMobile}) => {
  for (const [route, label, part, key, detail] of [
    ['lunar-rover','Lunar Roving Vehicle','Mesh wheels','wheel','Woven wire'],
    ['opportunity','Opportunity','Instrument arm','arm','rocks and soil'],
  ]) {
    await page.goto('./'+route+'/');
    await expect(page.getByRole('heading',{name:label,exact:true})).toBeVisible();
    await expect(page.locator('.hardware-frame.view-ready canvas')).toBeVisible();
    await page.getByRole('button',{name:'Rotate right'}).press('Enter');
    if(isMobile)await page.getByRole('button',{name:'Components',exact:true}).tap();
    await page.getByRole('button',{name:part,exact:true}).click();
    await expect(page.locator('.model-canvas')).toHaveAttribute('data-highlighted',key);
    await expect(page.locator('#component-detail')).toContainText(detail);
    if(isMobile) await page.getByRole('button',{name:'Close details'}).tap();
    const media = page.locator('.evidence img').first();
    await media.scrollIntoViewIfNeeded();
    await expect.poll(()=>media.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
    for(const anchor of await page.locator('a[href^="https:"]').all()){
      expect(approved.has((await anchor.getAttribute('href'))!)).toBe(true);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
});

test('the matching fallback remains available if the 3D model cannot load', async ({page}) => {
  await page.route('**/media/mer-vtad.glb', route=>route.abort());
  await page.goto('./opportunity/');
  await expect(page.getByText(/3D unavailable/)).toBeVisible();
  await expect(page.locator('.model-fallback img')).toBeVisible();
  await expect.poll(()=>page.locator('.model-fallback img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('heading',{name:'Mission timeline'})).toBeVisible();
});

test('dust changes sunlight, output, the graph and battery', async ({page})=>{
  await page.goto('./experiment/');
  await expect(page.locator('#charge')).toHaveText('50%');
  const dust=page.getByRole('slider',{name:/dust level/i});
  await dust.press('End');
  await expect(page.locator('#light')).toHaveText('20%');
  await expect(page.locator('#power')).toHaveText('20 units');
  await expect(page.locator('#net')).toHaveText('-25 units');
  await expect(page.locator('#power-graph')).toHaveAttribute('aria-label',/100% dust.*20 units/);
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await expect.poll(async()=>parseInt(await page.locator('#charge').innerText())).toBeLessThan(49);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  const paused=await page.locator('#charge').innerText();
  await page.waitForTimeout(450);
  await expect(page.locator('#charge')).toHaveText(paused);
  await page.getByRole('button',{name:'Reset'}).click();
  await expect(page.locator('#charge')).toHaveText('50%');
  await expect(page.locator('#power')).toHaveText('100 units');
});
