import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const output = process.argv[2] ?? 'test-results/walkthrough';
const url = process.env.OMNECARTA_TEST_URL ?? 'http://127.0.0.1:4173/';
await mkdir(output, {recursive:true});
const browser = await chromium.launch({
  executablePath: process.env.OMNECARTA_CHROME,
  args:['--enable-unsafe-swiftshader'],
});
try {
  const context = await browser.newContext({baseURL:url, viewport:{width:1200,height:780},recordVideo:{dir:output,size:{width:1200,height:780}}});
  const page = await context.newPage();
  const hold = (ms=1800)=>page.waitForTimeout(ms);
  await page.goto('./');
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:output+'/home.png'});
  await hold();
  await page.getByRole('link',{name:'Explore Omnecarta'}).click();
  await hold();
  await page.getByRole('link',{name:'The Moon',exact:true}).click();
  await hold();
  await page.getByRole('heading',{name:'Apollo 15 at Hadley'}).scrollIntoViewIfNeeded();
  await hold();
  await page.getByRole('link',{name:'Compare the Moon and Mars'}).click();
  await hold();
  await page.getByRole('navigation').getByRole('link',{name:'Mars',exact:true}).click();
  await hold();
  await page.getByRole('heading',{name:'Endeavour Crater'}).scrollIntoViewIfNeeded();
  await hold();
  await page.getByRole('link',{name:'Open the Opportunity exhibit'}).click();
  await page.locator('.rover-stage canvas').waitFor();
  await page.getByRole('button',{name:'Solar panels',exact:true}).click();
  await page.getByRole('button',{name:'Rotate right'}).click();
  await hold(2500);
  await page.getByRole('heading',{name:'Evidence from Mars'}).scrollIntoViewIfNeeded();
  await hold();
  await page.getByRole('link',{name:'Try the dust experiment'}).click();
  await page.getByRole('slider',{name:/dust level/i}).press('End');
  await page.getByRole('button',{name:/Play/}).click();
  await hold(3100);
  await page.getByRole('button',{name:/Pause/}).click();
  await page.getByRole('button',{name:'Talk to Solaris'}).click();
  await page.getByRole('button',{name:'Why is the battery draining?'}).click();
  await hold(4500);
  const video=page.video();
  await context.close();
  await video.saveAs(output+'/omnecarta-walkthrough.webm');
} finally { await browser.close(); }
