import {test,expect} from '@playwright/test';

test('windshield owns the frame and live instruments share the lower console',async({page})=>{
 await page.goto('./odyssey/?replay=1');await page.locator('#start-survey').click();
 const canvas=(await page.locator('#flight-stage canvas').boundingBox())!,consoleBox=(await page.locator('#flight-instruments').boundingBox())!,radar=(await page.locator('#flight-radar').boundingBox())!;
 expect(canvas.height).toBe(page.viewportSize()!.height);expect(consoleBox.y/canvas.height).toBeGreaterThan(.65);expect(Math.abs(radar.width-radar.height)).toBeLessThan(2);
 await expect(page.locator('#flight-records')).toBeHidden();await page.locator('#open-flight-records').click();await page.locator('#search-region').selectOption('camera');await page.locator('#flight-scan').click();
 await expect(page.locator('#flight')).toHaveAttribute('data-scans','1');await expect(page.locator('#contact-confidence')).toContainText('±');
 await expect(page.locator('.flight-dialogue')).toBeHidden({timeout:10000});
});

test('on foot: tools are closed, one waypoint is shown, interaction appears only in reach',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('omnecarta-story-v1',JSON.stringify({version:1,phase:'recover',x:-13,z:10,observed:[0,1],collected:[],fitted:[],samples:[],history:['Follow the locked contact.']})));
 await page.goto('./odyssey/');await page.locator('#mission-stage canvas').waitFor();
 await expect(page.locator('#mission-sidebar')).toBeHidden();await expect(page.locator('#interact')).toBeHidden();await expect(page.locator('#surface-waypoint-hud')).toContainText('Camera assembly');
 await expect(page.locator('#scene-caption')).toBeEmpty({timeout:10000});
 const heading=await page.locator('#mission-stage').getAttribute('data-camera-heading');await page.locator('#scanner-toggle').click();await expect(page.getByRole('dialog',{name:'Mission tools'})).toBeVisible();await page.getByRole('button',{name:'Close details'}).click();
 const canvas=page.locator('#mission-stage canvas'),r=(await canvas.boundingBox())!;
 await page.mouse.move(r.width*.5,r.height*.4);await page.mouse.down();await page.mouse.move(r.width*.65,r.height*.4,{steps:8});await page.mouse.up();await expect(page.locator('#mission-stage')).not.toHaveAttribute('data-camera-heading',heading!);
});

test('workbench remains rotatable with the fitting tools open',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('omnecarta-story-v1',JSON.stringify({version:1,phase:'assemble',x:0,z:0,observed:[0,1],collected:['camera','solar','wheel'],fitted:[],samples:[],history:[]})));
 await page.goto('./odyssey/');await page.locator('#mission-stage canvas').waitFor();await page.locator('#scanner-toggle').click();await page.locator('#assembly-part').selectOption('camera');
 const initial=await page.locator('#mission-stage').getAttribute('data-camera-heading'),w=page.viewportSize()!.width,h=page.viewportSize()!.height;
 await page.mouse.move(w*.22,h*.2);await page.mouse.down();await page.mouse.move(w*.38,h*.23,{steps:12});await page.mouse.up();await expect(page.locator('#mission-stage')).not.toHaveAttribute('data-camera-heading',initial!);
 await expect(page.locator('#workbench')).toBeVisible();await expect(page.locator('#assembly-clue')).toContainText('Mount it above');
});
