import { expect, test } from '@playwright/test';

test('archive routes, world models, exhibits, and approved sources',async({page})=>{
  const approved=new Set([
    'https://nssdc.gsfc.nasa.gov/',
    'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
    'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
  ]);
  async function checkSources() {
    for(const anchor of await page.locator('a[href^="https:"]').all()) {
      expect(approved.has((await anchor.getAttribute('href'))!)).toBeTruthy();
    }
  }
  await page.goto('./');
  await page.getByRole('link',{name:'Explore Omnecarta'}).click();
  await page.getByRole('link',{name:'The Moon',exact:true}).click();
  await expect(page.getByRole('heading',{name:'The Moon',exact:true})).toBeVisible();
  await expect(page.locator('.rover-stage canvas')).toBeVisible({timeout:15000});
  await checkSources();
  await page.getByRole('link',{name:'Open the Lunar Roving Vehicle exhibit'}).click();
  await expect(page.getByRole('table',{name:'Instruments'})).toContainText('Mesh wheels');
  await checkSources();
  await page.getByRole('navigation').getByRole('link',{name:'Mars',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Meridiani Planum'})).toBeVisible();
  await page.getByRole('link',{name:'Compare the Moon and Mars'}).click();
  await expect(page.getByRole('table')).toContainText('38%');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await checkSources();
  await page.goto('./mars/');
  await page.getByRole('link',{name:'Open the Opportunity exhibit'}).click();
  await expect(page.getByRole('heading',{name:'Opportunity',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('table',{name:'Instruments'})).toBeVisible();
  for(const image of await page.locator('.evidence img').all()){
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  }
  await page.getByRole('button',{name:'Talk to Solaris'}).click();
  await page.getByRole('button',{name:'What did Opportunity find?'}).click();
  await checkSources();
  await page.keyboard.press('Escape');
  await page.getByRole('navigation').getByRole('link',{name:'My Collection'}).click();
  await expect(page.getByText('Your collection is empty.')).toBeVisible();
});

test('rotatable exhibit and keyboard instrument controls',async({page})=>{
  await page.goto('./opportunity/');
  await expect(page.locator('.rover-stage canvas')).toBeVisible({timeout:15000});
  await page.getByRole('button',{name:'Rotate left'}).press('Enter');
  await page.getByRole('button',{name:'Solar panels',exact:true}).press('Enter');
  await expect(page.getByRole('button',{name:'Solar panels',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#ambient')).toContainText('turned sunlight into electricity');
});

test('illustration and instruments survive a viewer load failure',async({page})=>{
  await page.route('**/assets/archive-scene-*.js',route=>route.abort());
  await page.goto('./opportunity/');
  await expect(page.getByText('Interactive model unavailable')).toBeVisible();
  await expect(page.locator('.model-fallback img')).toBeVisible();
  await expect.poll(()=>page.locator('.model-fallback img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('table',{name:'Instruments'})).toContainText('Navigation cameras');
});

test('dust changes the power balance and Solaris responds',async({page})=>{
  await page.goto('./experiment/');
  await expect(page.locator('#charge')).toHaveText('50%');
  await page.getByRole('slider',{name:/dust level/i}).press('End');
  await expect(page.locator('#light')).toHaveText('20%');
  await expect(page.locator('#net')).toHaveText('-25 units');
  await expect(page.locator('#ambient')).toContainText('Why is the battery going down?');
  await page.getByRole('button',{name:/Play/}).click();
  await expect.poll(async()=>parseInt(await page.locator('#charge').innerText())).toBeLessThan(49);
  await page.getByRole('button',{name:/Pause/}).click();
  const paused=await page.locator('#charge').innerText();
  await page.waitForTimeout(400);
  await expect(page.locator('#charge')).toHaveText(paused);
  await page.getByRole('button',{name:'Reset'}).click();
  await expect(page.locator('#charge')).toHaveText('50%');
  await page.getByRole('button',{name:'Talk to Solaris'}).click();
  await page.getByRole('button',{name:'Why is the battery draining?'}).click();
  await expect(page.getByRole('link',{name:'NASA rover power and mission'})).toBeVisible();
  await page.getByRole('checkbox',{name:'Mute ambient remarks'}).check();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Talk to Solaris'})).toBeFocused();
});
