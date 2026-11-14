import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(process.argv[2] ?? 'artifacts/signal-views');
const baseURL = process.env.OMNECARTA_TEST_URL ?? 'http://127.0.0.1:4173/';
const browser = await chromium.launch({
  executablePath: process.env.OMNECARTA_CHROME,
  args: ['--enable-unsafe-swiftshader'],
});
const views = [
  ['', 'home', '.home-art img'],
  ['omnecarta/', 'omnecarta', '.world-deck'],
  ['moon/', 'moon', '.view-ready canvas'],
  ['mars/', 'mars', '.view-ready canvas'],
  ['lunar-rover/', 'lunar-rover', '.view-ready canvas'],
  ['opportunity/', 'opportunity', '.view-ready canvas'],
  ['odyssey/', 'odyssey-search', '#mission-stage canvas', 'search'],
  ['odyssey/', 'odyssey-workbench', '#mission-stage canvas', 'assemble'],
  ['collection/', 'collection', '.view-ready canvas', 'complete'],
];

await mkdir(output,{recursive:true});
try {
  for (const [size, settings] of [
    ['desktop', { viewport: { width: 1440, height: 920 } }],
    ['phone', devices['Pixel 7']],
  ]) {
    const context = await browser.newContext({ ...settings, baseURL, reducedMotion:'reduce' });
    const errors = [];
    for (const [path, name, ready, phase] of views) {
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      if (phase) await page.addInitScript(phase => {
        const parts = ['camera','solar','wheel'];
        const assembled = phase !== 'search';
        localStorage.setItem('omnecarta-story-v1', JSON.stringify({
          version: 1, phase, x: assembled ? 9 : 1, z: assembled ? -5 : 3,
          observed: assembled ? [0,1] : [0], collected: assembled ? parts : [],
          fitted: phase === 'complete' ? parts : [],
          samples: assembled ? [] : [{distance:33,strength:8},{distance:21,strength:18}],
          history: [phase === 'search' ? 'The signal is stronger near the tracks.' : 'The three parts are ready for fitting.'],
        }));
        if (phase === 'complete') localStorage.setItem('omnecarta-collection-v1',JSON.stringify(['opportunity']));
      }, phase);
      await page.goto(path || './');
      await page.locator(ready).waitFor({timeout:20000});
      if (phase === 'assemble') await page.locator('#workbench').waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        window.scrollTo(0,0);
        for (const image of document.images) image.loading = 'eager';
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      if (width > page.viewportSize().width) throw new Error(name+' overflows at '+size+' width ('+width+'px)');
      await page.screenshot({path:output+'/'+name+'-'+size+'.png',fullPage:true,scale:'css'});
      if (size === 'phone' && name === 'moon') {
        await page.getByRole('button',{name:'Focus Apollo 15 on globe'}).tap();
        await page.getByRole('dialog',{name:'World details'}).waitFor();
        await page.screenshot({path:output+'/moon-site-phone.png',scale:'css'});
      }
      if (name === 'opportunity') {
        if (size === 'phone') await page.getByRole('button',{name:'Components',exact:true}).tap();
        await page.getByRole('button',{name:'Solar deck',exact:true}).click();
        if (size === 'phone') await page.getByRole('button',{name:'Close details'}).tap();
        await page.screenshot({path:output+'/opportunity-selected-'+size+'.png',scale:'css'});
      }
      console.log(name+' · '+size);
      await page.close();
    }
    if(errors.length)throw new Error(errors.join('\n'));
    await context.close();
  }
} finally {
  await browser.close();
}
