import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>console.log('ERROR',e.message));await page.goto('http://127.0.0.1:5173/scripts/astra-study.html');await page.locator('body[data-ready="true"]').waitFor({timeout:60000});
const report=await page.evaluate(async()=>{window.setAstraPose(0,false,'idle',0);const {astra}=window.astraStudy;let t=0;const out=[];for(const phase of ['idle','walk','pickup','turn','idle']){for(let i=0;i<150;i++){t+=1/60;if(phase==='turn')astra.model.rotation.y+=.012;astra.pose(t,phase==='walk',phase==='pickup'?'pickup':'idle',phase==='pickup'?1:0);if(i%25===0)await new Promise(requestAnimationFrame);}out.push({phase,...astra.inspectRig(),grip:astra.gripPoint().toArray()});}return out;});console.log(JSON.stringify(report));await writeFile('artifacts/astra-detail/turn-report.json',JSON.stringify(report,null,2));
await page.evaluate(()=>window.astraStudy.view(-.2));await page.screenshot({path:'artifacts/astra-detail/cape-settled.png'});
await page.evaluate(()=>{const {astra}=window.astraStudy;astra.model.rotation.y=Math.PI;window.astraStudy.view(.6);});
await page.getByRole('button',{name:'Walk',exact:true}).click();await page.waitForTimeout(1000);await page.screenshot({path:'artifacts/astra-detail/walking.png'});
await page.getByRole('button',{name:'Recover',exact:true}).click();await page.waitForTimeout(850);await page.screenshot({path:'artifacts/astra-detail/clamp-grab.png'});
await page.waitForTimeout(600);await page.screenshot({path:'artifacts/astra-detail/clamp-lift.png'});
await page.getByRole('button',{name:'Idle',exact:true}).click();await page.waitForTimeout(2000);await page.evaluate(()=>window.astraStudy.view(2.85));await page.screenshot({path:'artifacts/astra-detail/back.png'});
}finally{await browser.close();}
