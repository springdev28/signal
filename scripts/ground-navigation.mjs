import { expect } from '@playwright/test';

/** Drive through the public controls using the camera's current orientation. */
export async function walkTo(page,selector,x,z,touch,tolerance=1,attempt=0){
  const stage=page.locator(selector);
  await expect(stage).toHaveAttribute('data-position',/.+,/);
  await stage.locator('canvas').focus();
  const cdp=touch?await page.context().newCDPSession(page):undefined;
  const keyFor={forward:'w',backward:'s',left:'a',right:'d'};
  let held=[];
  try{
    for(let n=0;n<230;n++){
      const data=await stage.evaluate(el=>({position:el.getAttribute('data-position').split(',').map(Number),heading:Number(el.getAttribute('data-camera-heading'))}));
      const dx=x-data.position[0],dz=z-data.position[1],range=Math.hypot(dx,dz);
      if(range<=tolerance)break;
      const right=dx*Math.cos(data.heading)-dz*Math.sin(data.heading),forward=-dx*Math.sin(data.heading)-dz*Math.cos(data.heading);
      const threshold=Math.max(Math.abs(right),Math.abs(forward))*.42;
      const next=[...(Math.abs(forward)>threshold?[forward>0?'forward':'backward']:[]),...(Math.abs(right)>threshold?[right>0?'right':'left']:[])];
      if(next.join(',')!==held.join(',')){
        if(cdp){
          if(held.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          const points=[];
          for(const [i,direction]of next.entries()){
            const box=(await page.getByRole('button',{name:'Move '+direction,exact:true}).boundingBox());
            points.push({id:i,x:box.x+box.width/2,y:box.y+box.height/2});
          }
          await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
        }else{
          for(const direction of held.filter(d=>!next.includes(d)))await page.keyboard.up(keyFor[direction]);
          for(const direction of next.filter(d=>!held.includes(d)))await page.keyboard.down(keyFor[direction]);
        }
        held=next;
      }
      await page.waitForTimeout(range<2?70:150);
    }
  }finally{
    if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
    else for(const d of held)await page.keyboard.up(keyFor[d]);
  }
  await expect.poll(async()=>Number(await stage.getAttribute('data-speed'))).toBeLessThan(.03);
  const point=(await stage.getAttribute('data-position')).split(',').map(Number);
  const remaining=Math.hypot(point[0]-x,point[1]-z);
  // Observe the stop before making a corrective input. GPU capture can delay
  // key-up delivery, so the driver must correct exactly as a player would.
  if(remaining>=tolerance+.8&&attempt<2)return walkTo(page,selector,x,z,touch,tolerance,attempt+1);
  expect(remaining).toBeLessThan(tolerance+.8);
}
