import { expect, test, type Page } from '@playwright/test';

async function checkLayout(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const problems = await page.evaluate(() => {
    const issues: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth) issues.push('Page has horizontal overflow');
    const controls = [...document.querySelectorAll<HTMLElement>('.topbar a, .topbar button')]
      .filter(el => el.checkVisibility());
    for (const [i, control] of controls.entries()) {
      const a = control.getBoundingClientRect();
      if (a.left < -1 || a.right > innerWidth + 1 || a.top < -1 || a.bottom > innerHeight + 1) issues.push('Navigation clipped: ' + control.textContent);
      for (const other of controls.slice(i + 1)) {
        const b = other.getBoundingClientRect();
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) {
          issues.push('Navigation overlap: ' + control.textContent + ' / ' + other.textContent);
        }
      }
    }
    for (const button of document.querySelectorAll<HTMLElement>('button, select, .button')) {
      if (!button.checkVisibility()) continue;
      const r = button.getBoundingClientRect();
      if (r.width < 43.5 || r.height < 43.5) issues.push('Small control: ' + (button.getAttribute('aria-label') || button.textContent));
    }
    return issues;
  });
  expect(problems).toEqual([]);
}

test('navigation and controls fit narrow, tablet, and desktop layouts', async ({ page, isMobile }) => {
  test.setTimeout(90000);
  for (const width of isMobile ? [320, 390] : [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['', 'moon/', 'opportunity/', 'compare/', 'odyssey/', 'experiment/', 'mars/?surface=eagle']) {
      await page.goto('./' + route);
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
      if (route === 'moon/' || route === 'opportunity/') await expect(page.locator('.view-ready')).toBeVisible();
      await checkLayout(page);
      if(route==='odyssey/')await page.getByRole('button',{name:'Menu',exact:true}).click();
      await page.getByRole('button', { name: 'Explore', exact: true }).click();
      await expect(page.locator('#explore-links a')).toHaveText(['Omni-View', 'Odyssey']);
      await checkLayout(page);
    }
  }
});

test('mission HUD controls and captions do not overlap', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 320 : 1024, height: 900 });
  await page.goto('./odyssey/?deploy=1');
  await expect(page.locator('#mission-stage canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Start mission' }).click();
  await page.locator('#scene-caption').evaluate(el => {
    el.textContent = 'A longer Solaris caption must remain readable and wrap inside its reserved space without colliding with the camera or movement controls.';
  });
  const toolbar = (await page.locator('.scene-toolbar').boundingBox())!;
  const scene = (await page.locator('#mission-stage').boundingBox())!;
  const caption = (await page.locator('.scene-caption').boundingBox())!;
  const field = (await page.locator('#field-controls').boundingBox())!;
  const intersects = (a: typeof toolbar, b: typeof toolbar) =>
    Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1 &&
    Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
  expect(scene.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
  expect(scene.height).toBeGreaterThanOrEqual(page.viewportSize()!.height - 1);
  expect(intersects(toolbar,caption)).toBe(false);
  expect(intersects(field,caption)).toBe(false);
  expect(intersects(toolbar,field)).toBe(false);
  await checkLayout(page);
  if (isMobile) {
    await page.getByRole('button', { name: 'Map & scanner', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Mission tools' });
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('#signal-chart')).toBeVisible();
    await drawer.getByRole('button', { name: 'Close details' }).click();
    await expect(page.locator('#scanner-toggle')).toBeFocused();
  }
});

test('Solaris temporarily replaces a task dialog and restores its focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./odyssey/?deploy=1');
  await page.getByRole('button', { name: 'Clues', exact: true }).click();
  const clues = page.getByRole('dialog', { name: 'Clues', exact: true });
  await clues.getByRole('button', { name: 'Solaris', exact: true }).click();
  await expect(clues).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'Solaris', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close Solaris' }).click();
  await expect(clues).toBeVisible();
  await expect(clues.getByRole('button', { name: 'Solaris', exact: true })).toBeFocused();
});

test('enlarged text reflows without clipping navigation or scene controls', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: isMobile ? 390 : 1024, height: 900 });
  await page.goto('./odyssey/?deploy=1');
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await checkLayout(page);
  await page.getByRole('button', { name: 'Solaris', exact: true }).click();
  const dialog = (await page.locator('#solaris-panel').boundingBox())!;
  expect(dialog.x).toBeGreaterThanOrEqual(0);
  expect(dialog.x + dialog.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(dialog.y + dialog.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
});
