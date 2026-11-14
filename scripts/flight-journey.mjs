import {expect} from '@playwright/test';
export async function flyJourney(page,{mobile=false,capture=async()=>{},hold=0}={}){
 const pause=()=>page.waitForTimeout(hold);
 const click=async id=>{const button=page.locator(id);if(mobile)await button.tap();else await button.click();};
 const records=async open=>{if(await page.locator('#flight-records').evaluate(e=>e.open)!==open)await page.locator('#flight-records summary').click();};
 const pos=async()=> (await page.locator('#flight').getAttribute('data-position')).split(',').map(Number);
 async function holdControl(key,selector,condition,timeout=20000){
  if(!mobile){await page.keyboard.down(key);try{await expect.poll(condition,{timeout,intervals:[35]}).toBeTruthy();}finally{await page.keyboard.up(key);}}
  else{
   const r=await page.locator(selector).boundingBox(),cdp=await page.context().newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});
   try{await expect.poll(condition,{timeout,intervals:[35]}).toBeTruthy();}finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  }
 }
 async function turn(target){
  await page.locator('#flight-stage canvas').focus();
  const error=async()=>{const a=target-Number(await page.locator('#flight').getAttribute('data-heading'));return Math.atan2(Math.sin(a),Math.cos(a));};
  for(let n=0;n<3;n++){
   const d=await error();if(Math.abs(d)<.045)break;
   await holdControl(d>0?'d':'a',`[data-steer="${d>0?'right':'left'}"]`,async()=>d>0?(await error())<.025:(await error())>-.025);
  }
 }
 async function fly(x,z){
  const p=await pos(),dx=x-p[0],dz=z-p[1],length=Math.hypot(dx,dz);
  await turn(Math.atan2(dx,-dz));
  await page.locator('#flight-throttle').focus();await page.keyboard.press('Home');for(let i=0;i<12;i++)await page.keyboard.press('ArrowRight');
  await expect.poll(async()=>{const q=await pos();return (q[0]-p[0])*dx/length+(q[1]-p[1])*dz/length;},{timeout:25000,intervals:[40]}).toBeGreaterThan(length-1);
  await click('#flight-brake');
 }
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',message=>{if(message.type()==='error'&&/Shader Error|VALIDATE_STATUS|GL_INVALID/.test(message.text()))errors.push(message.text());});
 await page.goto('./odyssey/?replay=1');
 await expect(page.locator('#flight-stage.view-ready canvas')).toBeVisible();
 await capture('briefing');await pause();await click('#start-survey');
 await records(true);await page.locator('#search-region').selectOption('solar');await records(!mobile);
 await click('#flight-scan');await expect(page.locator('#flight-line')).toContainText('does not agree');
 await expect(page.locator('#flight')).toHaveAttribute('data-scans','0');
 async function scans(){
  for(const id of ['camera','solar','wheel']){
   await records(true);await click(`[data-contact="${id}"]`);await page.locator('#search-region').selectOption(id);await pause();
   await records(!mobile);await page.waitForTimeout(850);await click('#flight-scan');await pause();
  }
 }
 await scans();await expect(page.locator('#flight')).toHaveAttribute('data-scans','3');
 await page.waitForTimeout(850);await click('#flight-scan');await expect(page.locator('#flight-line')).toContainText('same bearing');
 await expect(page.locator('#flight')).toHaveAttribute('data-scans','3');
 await capture('first-bearings');
 await fly(-14,5);await scans();await expect(page.locator('#flight')).toHaveAttribute('data-scans','6');
 await click('#flight-camera');await fly(24,5);await capture('ship');await click('#flight-camera');
 await scans();await expect(page.locator('#flight')).toHaveAttribute('data-scans','9');
 for(const id of ['camera','solar','wheel']){
  await records(true);await click(`[data-contact="${id}"]`);await expect(page.locator('#lock-contact')).toBeEnabled();await click('#lock-contact');await pause();
 }
 await expect(page.locator('#flight')).toHaveAttribute('data-locks','3');
 const fixes=await page.evaluate(()=>JSON.parse(localStorage.getItem('signal-flight-v1')).contacts);
 await capture('locked');await click('#begin-approach');await click('#guide-landing');
 await expect(page.locator('#flight-line')).toContainText('On the clear zone',{timeout:40000});
 await expect(page.locator('#land-ship')).toBeEnabled();await capture('approach');await click('#land-ship');
 await expect(page.locator('#stabilize-descent')).toBeVisible();await pause();await click('#stabilize-descent');
 await expect(page.locator('#step-outside')).toBeEnabled({timeout:15000});await capture('touchdown');await pause();await click('#step-outside');
 await expect(page.locator('#mission-stage canvas')).toBeVisible({timeout:20000});await expect(page.locator('#progress')).toHaveText('0/3 recovered');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('signal-flight-v1')).contacts)).toEqual(fixes);
 await capture('surface');
 const groundPos=async()=>{const s=await page.locator('#field-position').innerText(),m=s.match(/(\d+) m ([EW]) · (\d+) m ([NS])/);return [Number(m[1])*(m[2]==='W'?-1:1),Number(m[3])*(m[4]==='N'?-1:1)];};
 async function walk(x,z){
  for(let axis=0;axis<2;axis++)for(let n=0;n<4;n++){
   const target=axis?z:x,d=target-(await groundPos())[axis];if(Math.abs(d)<=1)break;
   const dir=axis?(d>0?'south':'north'):(d>0?'east':'west'),key=axis?(d>0?'s':'w'):(d>0?'d':'a');
   await holdControl(key,`[aria-label="Move ${dir}"]`,async()=>d>0?(await groundPos())[axis]>=target-1:(await groundPos())[axis]<=target+1,15000);
  }
 }
 for(const [id,name,x,z] of [['camera','Camera assembly',6,-12],['solar','Solar panel',14,-8],['wheel','Wheel assembly',9,-5]]){
  await walk(x,z);await page.getByRole('button',{name:'Inspect '+name,exact:true}).click();await pause();await click('#collect-part');await page.waitForTimeout(800);
 }
 await expect(page.locator('#progress')).toHaveText('0/3 fitted');
 if(mobile)await click('#scanner-toggle');
 await capture('workbench');
 await page.locator('#assembly-part').selectOption('camera');await page.locator('#assembly-mount').selectOption('deck');await click('#fit-part');
 await expect(page.locator('#fit-feedback')).toContainText('doesn’t fit');
 for(const [id,mount,rotations] of [['camera','mast',0],['solar','deck',2],['wheel','axle',4]]){
  await page.locator('#assembly-part').selectOption(id);await page.locator('#assembly-mount').selectOption(mount);
  for(let n=0;n<rotations;n++){await click('#rotate-part');await page.waitForTimeout(200);}
  await pause();await click('#fit-part');await page.waitForTimeout(1200);
 }
 await expect(page.locator('#progress')).toHaveText('3/3 fitted');await capture('complete');
 await page.getByRole('main').getByRole('link',{name:'My Collection',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Opportunity',exact:true})).toBeVisible();await pause();await capture('collection');
 expect(errors).toEqual([]);
}
