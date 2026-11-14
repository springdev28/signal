import {test,expect} from '@playwright/test';

test('direct links and guide navigation',async({page})=>{
  await page.goto('./');
  await expect(page.getByRole('heading',{name:/^omnecarta$/i})).toBeVisible();
  await page.getByRole('link',{name:'Explore the archive'}).click();
  await page.getByRole('link',{name:/natural satellite the moon/i}).click();
  await expect(page.getByRole('heading',{name:'The Moon',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Explore in NASA Eyes'})).toHaveAttribute('href',/solar-system\/#\/home$/);
  await page.getByRole('navigation').getByRole('link',{name:'Mars',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Meridiani Planum'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Perseverance Valley'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Explore Mars in NASA Eyes'})).toHaveAttribute('href',/solar-system\/#\/mars$/);
  await page.getByRole('link',{name:/compare the moon and mars/i}).click();
  await expect(page.getByRole('table')).toContainText('38%');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.goto('./mars/');
  await page.getByRole('link',{name:'Open the Opportunity exhibit'}).click();
  await expect(page.getByRole('heading',{name:'Opportunity',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'NASA: Mars Exploration Rovers mission overview'})).toHaveAttribute('href',/mars-exploration-rovers-spirit-and-opportunity/);
  for (const image of await page.locator('.evidence img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  }
});

test('viewer loads and its instrument buttons work from the keyboard',async({page})=>{
  await page.goto('./opportunity/');
  await expect(page.locator('.rover-stage canvas')).toBeVisible({timeout:25000});
  await page.getByRole('button',{name:'Rotate left'}).press('Enter');
  await page.getByRole('button',{name:'02 · Solar panels',exact:true}).press('Enter');
  await expect(page.locator('#part-detail')).toContainText('turned sunlight into electricity');
  await expect(page.locator('#ambient')).toContainText('Those panels kept Opportunity going');
});

test('labeled image and details survive a model download failure',async({page})=>{
  await page.route('**/media/mer.glb',route=>route.abort());
  await page.goto('./opportunity/');
  await expect(page.getByText('Interactive model unavailable')).toBeVisible();
  await expect(page.locator('#rover-fallback img')).toBeVisible();
  await expect(page.getByText('01 · Camera mast')).toBeVisible();
  await page.getByRole('button',{name:'02 · Solar panels',exact:true}).click();
  await expect(page.locator('#part-detail')).toContainText('turned sunlight into electricity');
});

test('dust changes power balance, playback, and Solaris reacts',async({page})=>{
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
  await expect(page.locator('#net')).toHaveText('+55 units');
  await page.getByRole('button',{name:'Talk to Solaris'}).click();
  await page.getByRole('button',{name:'Why is the battery draining?'}).click();
  await expect(page.getByRole('link',{name:'NASA: Rover power and mission'})).toBeVisible();
  await page.getByRole('checkbox',{name:'Mute ambient remarks'}).check();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Talk to Solaris'})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/opportunity\/$/);
  await expect(page.locator('.rover-stage canvas')).toBeVisible();
  await page.getByRole('button',{name:'Talk to Solaris'}).press('Enter');
  await expect(page.getByRole('checkbox',{name:'Mute ambient remarks'})).toBeChecked();
  await expect(page.getByRole('button',{name:'What did Opportunity find?'})).toBeVisible();
});
