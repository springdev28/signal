import { chromium } from '@playwright/test';
import { copyFile, mkdir } from 'node:fs/promises';
const out='artifacts/astra-detail';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:`${out}/motion`,size:{width:1440,height:1000}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/scripts/astra-study.html');await page.locator('body[data-ready="true"]').waitFor();
 for(const [name,duration]of [['Idle',2200],['Walk',3200],['Recover',3000],['Scan',2200],['Idle',2000]]){
   await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(duration);
 }
 const video=page.video();await context.close();await copyFile(await video.path(),`${out}/astra-motion.webm`);
 await copyFile(`${out}/astra-motion.webm`,'artifacts/design-resume/astra-motion.webm');console.log(JSON.stringify({errors,preview:`${out}/astra-motion.webm`}));
} finally {await browser.close();}
