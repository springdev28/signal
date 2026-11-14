import { chromium } from '@playwright/test';
import { copyFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1500,height:940}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/scripts/astra-study.html');
 await page.locator('body[data-ready="true"]').waitFor();
 await page.screenshot({path:'artifacts/design-resume/astra-body-and-cape.png'});
 await copyFile('artifacts/design-resume/astra-body-and-cape.png','artifacts/astra-detail/quarter.png');
 console.log(JSON.stringify({errors}));
}finally{await browser.close();}
