import {chromium,devices} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts/cinematic',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.OMNECARTA_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
const errors=[];
for(const [size,options] of [['desktop',{viewport:{width:1440,height:920}}],['phone',devices['Pixel 7']]]){
 const context=await browser.newContext({...options,baseURL:process.env.OMNECARTA_TEST_URL||'http://127.0.0.1:4200/',reducedMotion:'reduce'});
 for(const mode of ['surface','workbench','moon','mars','opportunity','lunar-rover']){
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader Error|VALIDATE_STATUS/.test(m.text()))errors.push(m.text());});
  if(mode==='surface'||mode==='workbench')await page.addInitScript(mode=>{localStorage.setItem('omnecarta-story-v1',JSON.stringify({version:1,phase:mode==='surface'?'recover':'assemble',x:-13,z:10,observed:[0,1],collected:mode==='surface'?[]:['camera','solar','wheel'],fitted:[],samples:[],history:[]}));},mode);
  await page.goto(mode==='surface'||mode==='workbench'?'odyssey/':mode+'/');await page.locator(mode==='surface'||mode==='workbench'?'#mission-stage canvas':'.view-ready canvas').first().waitFor();await page.waitForTimeout(1500);
  if(mode==='workbench'){await page.locator('#scanner-toggle').click();await page.locator('#assembly-part').selectOption('camera');await page.waitForTimeout(280);}
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)errors.push(mode+' '+size+' overflow');
  await page.screenshot({path:`artifacts/cinematic/${mode}-${size}.png`,scale:'css'});console.log(mode,size);await page.close();
 }
 await context.close();
}
await browser.close();if(errors.length)throw Error(errors.join('\n'));
