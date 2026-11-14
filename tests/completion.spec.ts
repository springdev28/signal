import {test,expect} from '@playwright/test';

test('completion keeps the assembled craft visible and offers useful next actions',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('omnecarta-story-v1',JSON.stringify({version:1,phase:'complete',x:9,z:-5,observed:[0,1],collected:['camera','solar','wheel'],fitted:['camera','solar','wheel'],samples:[],history:[]})));
 await page.goto('./odyssey/');await page.locator('#mission-stage canvas').waitFor();
 const panel=(await page.locator('#mission-complete').boundingBox())!;
 expect(panel.height).toBeLessThan(page.viewportSize()!.height*.3);
 expect(panel.y).toBeGreaterThan(page.viewportSize()!.height*.45);
 await expect(page.locator('#mission-complete').getByRole('link',{name:'My Collection'})).toBeVisible();
 await expect(page.locator('#scanner-toggle')).toBeHidden();
});
