import { chromium,devices } from 'playwright';
const browser=await chromium.launch({executablePath:process.env.OMNECARTA_CHROME||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true,args:['--enable-unsafe-swiftshader']});
for(const [name,options] of [['desktop',{viewport:{width:1440,height:920}}],['phone',devices['Pixel 7']]]){
 const context=await browser.newContext(options),page=await context.newPage();
 page.on('pageerror',e=>console.log(name,e.message));
 await page.goto((process.env.OMNECARTA_TEST_URL||'http://127.0.0.1:4196/')+'odyssey/');await page.locator('#flight-stage.view-ready').waitFor();await page.waitForTimeout(1200);
 await page.screenshot({scale:'css',path:`artifacts/flight/${name}-brief.png`});
 await page.locator('#start-survey').click();await page.locator('#open-flight-records').click();await page.locator('#search-region').selectOption('camera');await page.locator('#flight-scan').click();await page.waitForTimeout(7000);
 await page.screenshot({scale:'css',path:`artifacts/flight/${name}-cockpit.png`});
 console.log(name,await page.evaluate(()=>({overflow:document.documentElement.scrollWidth,viewport:innerWidth,canvas:document.querySelector('#flight-stage canvas').getBoundingClientRect().toJSON()})));
 await context.close();
}
await browser.close();
