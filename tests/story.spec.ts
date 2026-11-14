import { expect, test, type Page } from '@playwright/test';

type Direction='north'|'south'|'west'|'east';
const keys:Record<Direction,string>={north:'w',south:'ArrowDown',west:'a',east:'ArrowRight'};

async function location(page:Page){
  const label=await page.locator('#field-position').innerText();
  const match=label.match(/(\d+) m ([EW]) · (\d+) m ([NS])/);
  if(!match)throw new Error('Position unavailable: '+label);
  return [Number(match[1])*(match[2]==='W'?-1:1),Number(match[3])*(match[4]==='N'?-1:1)];
}

async function moveTo(page:Page, x:number, z:number, touch:boolean){
  for(let axis=0;axis<2;axis++){
    const target=axis===0?x:z;
    for(let attempt=0;attempt<4;attempt++){
      const point=await location(page);
      const difference=target-point[axis];
      if(Math.abs(difference)<=1)break;
      const direction:Direction=axis===0?(difference>0?'east':'west'):(difference>0?'south':'north');
      if(touch){
        const button=page.getByRole('button',{name:'Move '+direction,exact:true});
        await button.scrollIntoViewIfNeeded();
        const bounds=(await button.boundingBox())!;
        const finger={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
        const cdp=await page.context().newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger]});
        await expect.poll(async()=>Math.abs(target-(await location(page))[axis]),{timeout:6000,intervals:[45]}).toBeLessThanOrEqual(1);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await cdp.detach();
      }else{
        await page.keyboard.down(keys[direction]);
        await expect.poll(async()=>Math.abs(target-(await location(page))[axis]),{timeout:6000,intervals:[45]}).toBeLessThanOrEqual(1);
        await page.keyboard.up(keys[direction]);
      }
    }
    expect(Math.abs(target-(await location(page))[axis])).toBeLessThanOrEqual(1);
  }
}

test('finish the story with movement, recovery, and assembly',async({page,isMobile})=>{
  test.setTimeout(105000);
  if(isMobile)await page.emulateMedia({reducedMotion:'reduce'});
  const activate=async(name:string)=>{
    const button=page.getByRole('button',{name,exact:true});
    if(isMobile)await button.tap();else await button.press('Enter');
  };
  await page.goto('./');
  const play=page.getByRole('main').getByRole('link',{name:'Play Story'});
  if(isMobile)await play.tap();else await play.press('Enter');
  await expect(page.locator('#mission-stage canvas')).toBeVisible({timeout:15000});
  await expect(page.getByRole('heading',{name:'Briefing'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await activate('Start mission');
  await activate('Scan');
  const initial=await page.locator('#field-reading').innerText();
  await activate('Talk to Solaris');
  await activate('Request hint');
  await expect(page.locator('#story-hint')).toContainText('two landmarks');
  await activate('Request hint');
  await expect(page.locator('#story-hint')).toContainText('Twin spires');
  await activate('Close Solaris');
  await moveTo(page,-8,-4,isMobile);
  if(isMobile)await activate('Scan');else await page.keyboard.press('e');
  await expect(page.locator('#progress')).toHaveText('1/2 observations');
  await expect(page.locator('#field-reading')).not.toHaveText(initial);
  await expect(page.locator('#signal-chart')).toHaveAttribute('aria-label',/m, \d+%; \d/);
  const lastPosition=await location(page);
  await page.reload();
  await expect(page.locator('#progress')).toHaveText('1/2 observations');
  expect(await location(page)).toEqual(lastPosition);
  await moveTo(page,5,4,isMobile);
  await activate('Scan');
  await expect(page.locator('#progress')).toHaveText('2/2 observations');
  await moveTo(page,10,-10,isMobile);
  await activate('Scan');
  await expect(page.getByRole('dialog',{name:'Stabilize the scanner'})).toBeVisible();
  if(isMobile){
    await expect(page.getByText('Select Stabilize when you’re ready.')).toBeVisible();
  }else{
    await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible({timeout:10000});
    await activate('Retry');
    await expect(page.locator('#cutscene-time')).toContainText('remaining');
    await activate('Stabilize');
    await expect(page.locator('#progress')).toHaveText('0/3 recovered');
  }
  if(isMobile)await activate('Stabilize');
  await expect(page.locator('#progress')).toHaveText('0/3 recovered');
  await expect(page.getByRole('button',{name:'Inspect part',exact:true})).toBeDisabled();
  for(const [part,x,z] of [['Camera assembly',6,-12],['Solar panel',14,-8],['Wheel assembly',9,-5]] as const){
    await moveTo(page,x,z,isMobile);
    await activate('Inspect '+part);
    await expect(page.getByRole('dialog',{name:part})).toBeVisible();
    await activate('Collect part');
    await expect(page.getByRole('row',{name:new RegExp(part)})).toContainText('Collected');
  }
  await expect(page.getByRole('heading',{name:'Workbench'})).toBeVisible();
  const selectPart=page.getByRole('combobox',{name:'Part',exact:true});
  const selectMount=page.getByRole('combobox',{name:'Mount',exact:true});
  await selectPart.selectOption('camera');
  await selectMount.selectOption('deck');
  await activate('Fit Part');
  await expect(page.locator('#fit-feedback')).toContainText('doesn’t fit');
  await expect(page.locator('#progress')).toHaveText('0/3 fitted');
  await selectMount.selectOption('mast');
  await activate('Fit Part');
  await expect(page.locator('#progress')).toHaveText('1/3 fitted');
  await page.reload();
  await expect(page.locator('#progress')).toHaveText('1/3 fitted');
  await selectPart.selectOption('solar');
  await selectMount.selectOption('deck');
  await activate('Fit Part');
  await expect(page.locator('#fit-feedback')).toContainText('Rotate it toward');
  await expect(page.locator('#progress')).toHaveText('1/3 fitted');
  await activate('Rotate 45°');
  await activate('Rotate 45°');
  await activate('Fit Part');
  await selectPart.selectOption('wheel');
  await selectMount.selectOption('axle');
  for(let i=0;i<4;i++)await activate('Rotate 45°');
  await activate('Fit Part');
  await expect(page.getByRole('heading',{name:'Opportunity reassembled'})).toBeVisible();
  await expect(page.locator('#progress')).toHaveText('3/3 fitted');
  await page.getByRole('main').getByRole('link',{name:'My Collection'}).click();
  await expect(page.getByRole('heading',{name:'Opportunity',exact:true})).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Opportunity',exact:true})).toHaveCount(1);
  await page.getByRole('link',{name:'Replay Story'}).click();
  await expect(page.getByRole('heading',{name:'Briefing'})).toBeVisible();
  await page.getByRole('navigation').getByRole('link',{name:'My Collection'}).click();
  await expect(page.getByRole('heading',{name:'Opportunity',exact:true})).toHaveCount(1);
});

test('manual untimed scanner input restores control',async({page})=>{
  await page.addInitScript(()=>{
    if(sessionStorage.getItem('scanner-fixture'))return;
    sessionStorage.setItem('scanner-fixture','1');
    localStorage.setItem('omnecarta-story-v1',JSON.stringify({
      version:1,phase:'locate',x:10,z:-10,observed:[0,1],collected:[],fitted:[],samples:[],history:[],
    }));
  });
  await page.goto('./story/');
  await page.getByRole('button',{name:'Scan',exact:true}).click();
  await page.getByRole('button',{name:'Use untimed input'}).click();
  await expect(page.getByText('Select Stabilize when you’re ready.')).toBeVisible();
  await page.getByRole('button',{name:'Stabilize',exact:true}).click();
  await expect(page.locator('#progress')).toHaveText('0/3 recovered');
  await expect(page.getByRole('button',{name:'Move north'})).toBeVisible();
});
