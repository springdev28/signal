import {expect, test} from '@playwright/test';

test('PlayCanvas Astra runtime loads the shipped clips and switches animation', async ({page, isMobile}) => {
  test.skip(isMobile, 'The asset preview is a desktop inspection surface.');
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./astra/runtime.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true', {timeout: 60000});
  await expect(page.locator('body')).toHaveAttribute('data-animation', 'Idle');
  await expect.poll(async () => Number(await page.locator('body').getAttribute('data-frame'))).toBeGreaterThan(2);
  await page.getByRole('button', {name: 'Walk', exact: true}).click();
  await expect(page.locator('body')).toHaveAttribute('data-animation', 'Walk');
  await expect(page.getByRole('button', {name: 'Walk', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', {name: 'Idle', exact: true})).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', {name: 'Recover', exact: true}).click();
  await expect(page.locator('body')).toHaveAttribute('data-animation', 'Recover');
  expect(errors).toEqual([]);
});
