import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL=process.env.SIGNAL_PREVIEW_URL??'http://127.0.0.1:5173/';
const suffix=process.env.SIGNAL_PREVIEW_LABEL??'after';
await mkdir('artifacts/design-resume',{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
  for(const [name,url,width,height] of [
    ['surface','mars/?surface=eagle',1440,900],['moon','moon/',1440,900],
    ['surface-phone','mars/?surface=eagle',390,844],['mission','odyssey/?deploy=1',1440,900],
    ['mission-phone','odyssey/?deploy=1',320,640],
  ]){
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&/Shader Error|VALIDATE_STATUS/.test(m.text()))errors.push(m.text());});
    await page.goto(new URL(url,baseURL).href);
    await page.locator('.view-ready canvas, #mission-stage canvas').first().waitFor();
    if(name.startsWith('mission'))await page.getByRole('button',{name:'Start mission',exact:true}).click();
    await page.waitForTimeout(1800);
    await page.screenshot({path:`artifacts/design-resume/${name}-${suffix}.png`});
    console.log(JSON.stringify({name,errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}));
    await page.close();
  }
} finally {await browser.close();}
