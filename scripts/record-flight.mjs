import {chromium} from 'playwright';
import {flyJourney} from './flight-journey.mjs';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts/flight',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.OMNECARTA_CHROME||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true,args:['--enable-unsafe-swiftshader']});
const context=await browser.newContext({baseURL:process.env.OMNECARTA_TEST_URL||'http://127.0.0.1:4196/',viewport:{width:1280,height:800},recordVideo:{dir:'artifacts/flight/video',size:{width:960,height:600}},reducedMotion:'no-preference'});
const page=await context.newPage(),video=page.video();
try{await flyJourney(page,{hold:1100,capture:async name=>{console.log(name);await page.screenshot({path:`artifacts/flight/desktop-${name}.png`});}});}
finally{await context.close();await video.saveAs('artifacts/flight/odyssey-continuous.webm');await browser.close();}
