import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='artifacts/astra-detail';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.OMNECARTA_CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|Ammo|animation/i.test(m.text()))errors.push(m.text());});
 await page.goto('http://127.0.0.1:5173/scripts/astra-study.html');await page.locator('body[data-ready="true"]').waitFor({timeout:60000});
 assert.equal(await page.locator('[data-view]').count(),0,'Viewpoint buttons must be removed.');
 const before=Number(await page.locator('body').getAttribute('data-heading'));
 await page.mouse.move(950,470);await page.mouse.down();await page.mouse.move(1120,490,{steps:12});await page.mouse.up();await page.waitForTimeout(500);
 const turned=Number(await page.locator('body').getAttribute('data-heading'));assert(Math.abs(turned-before)>.1,'Dragging must rotate.');
 await page.waitForTimeout(5800);assert(Math.abs(Number(await page.locator('body').getAttribute('data-heading')))<.03,'Camera must return to the front after inactivity.');
 const initialZoom=await page.evaluate(()=>window.astraStudy.camera.position.distanceTo(window.astraStudy.controls.target));await page.mouse.wheel(0,-200);await page.waitForTimeout(500);assert((await page.evaluate(()=>window.astraStudy.camera.position.distanceTo(window.astraStudy.controls.target)))<initialZoom);
 const report=await page.evaluate(async()=>{
  const {astra}=window.astraStudy;window.setAstraPose(30,false,'idle',0);let time=30,maxFloor=0,maxAnchor=0,maxStretch=0,clampMax=0,clampMin=1;const phases=[];
  function positions(){const p=[];for(const name of ['UpperArmL','LowerArmL','UpperLegL','Left flexible antenna','Three-finger tail claw']){const n=astra.model.getObjectByName(name);p.push(n.matrixWorld.elements.slice());}return p;}
  const motions=[];const materials=new Set();astra.model.traverse(n=>{if(n.isMesh&&!Array.isArray(n.material)&&n.material.userData.surfaceFinish)materials.add(n.material);});
  for(const m of materials)if(!m.map||!m.roughnessMap||!m.bumpMap)throw new Error('Missing texture maps: '+m.userData.surfaceFinish);
  for(const [action,walk,amount]of [['idle',0,0],['idle',1,0],['scan',0,1],['pickup',0,1],['assemble',0,1],['talk',0,1],['idle',0,0]]){
   const start=positions();let stretch=0;
   for(let i=0;i<75;i++){
    time+=1/60;astra.pose(time,walk,action,amount);const r=astra.inspectRig();maxFloor=Math.max(maxFloor,Math.abs(r.floorClearance));clampMax=Math.max(clampMax,r.clampClosed);clampMin=Math.min(clampMin,r.clampClosed);
    for(const c of r.physics.cloth){maxAnchor=Math.max(maxAnchor,c.anchorError);stretch=Math.max(stretch,c.maxStretch);}
    if(i%25===0)await new Promise(requestAnimationFrame);
   }
   maxStretch=Math.max(maxStretch,stretch);phases.push({action,walk,stretch});motions.push({action,walk,delta:positions().map((a,i)=>Math.max(...a.map((v,j)=>Math.abs(v-start[i][j]))))});
  }
  const eyes=astra.model.getObjectByName('Left digital display').material.uniforms;astra.pose(14.60,false,'idle',0);const openA=eyes.openness.value;astra.pose(14.67,false,'idle',0);const openB=eyes.openness.value;astra.pose(15.4,false,'idle',0);const gazeA=eyes.gaze.value.toArray();astra.pose(16.3,false,'idle',0);const gazeB=eyes.gaze.value.toArray();
  return {sampledPoses:525,maxFloor,maxAnchor,maxStretch,clampMax,clampMin,phases,motions,texturedMaterials:materials.size,eyes:{openA,openB,gazeA,gazeB},...astra.inspectRig()};
 });
 await writeFile(`${out}/physics-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 assert(report.rig.importedMeshes>=10);assert.equal(report.physics.engine,'Bullet / Ammo WASM');assert.equal(report.physics.softBodies,2);assert(report.physics.steps>500);
 assert(report.maxFloor<.0001,'Supporting foot must touch the floor.');assert(report.maxAnchor<.0001,'Cloth must stay anchored.');assert(report.maxStretch<.45,'Cloth must keep its dimensions.');assert(report.clampMax>.95&&report.clampMin<.05,'Clamp must open and close.');assert.notDeepEqual(report.eyes.gazeA,report.eyes.gazeB);assert.notEqual(report.eyes.openA,report.eyes.openB);
 assert(report.motions[0].delta[0]>.001&&report.motions[1].delta[2]>.02,'Real limbs must move in idle and walking.');
 await page.evaluate(()=>{window.setAstraPose(40,false,'idle',0);window.astraStudy.view(0);});await page.screenshot({path:`${out}/front.png`});
 await page.evaluate(()=>window.astraStudy.view(.6));await page.screenshot({path:`${out}/quarter.png`});
 await page.evaluate(()=>window.astraStudy.view(2.85));await page.screenshot({path:`${out}/back.png`});
 await page.evaluate(()=>{const {camera,controls}=window.astraStudy;controls.target.set(0,2.35,0);camera.position.set(.15,2.4,2.0);controls.update();});await page.screenshot({path:`${out}/digital-eyes.png`});
 await page.setViewportSize({width:412,height:839});await page.evaluate(()=>window.astraStudy.view(.55));await page.screenshot({path:`${out}/phone.png`});
 const client=await page.context().newCDPSession(page),touchBefore=Number(await page.locator('body').getAttribute('data-heading'));
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:430}]});for(let i=0;i<9;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190+i*12,y:430}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);assert(Math.abs(Number(await page.locator('body').getAttribute('data-heading'))-touchBefore)>.1);await client.detach();
 assert.deepEqual(errors,[]);await writeFile(`${out}/rig-report.json`,JSON.stringify({errors,mouseOrbit:true,touchOrbit:true,wheelZoom:true,autoFront:true,...report},null,2));
}finally{await browser.close();}
