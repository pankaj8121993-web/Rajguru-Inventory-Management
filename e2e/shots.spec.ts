import { test } from '@playwright/test';

/** Captures screenshots of the running app for review. Not an assertion suite. */
const OUT = '/workspace/shots';

test('capture screens', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const [name, path] of [
    ['1-dashboard', '/'],
    ['2-locations', '/locations'],
    ['4-commodities', '/commodities'],
    ['6-parties', '/parties'],
    ['8-reason-codes', '/reason-codes'],
    ['10-weighments', '/weighments'],
    ['12-administration', '/administration'],
  ] as const) {
    await page.goto(`http://127.0.0.1:3000${path}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  }

  // Weighment entry form with a live net-weight difference.
  await page.goto('http://127.0.0.1:3000/weighments');
  await page.getByRole('button', { name: '+ New weighment' }).click();
  await page.fill('#w_gross', '24500');
  await page.fill('#w_tare', '9800');
  await page.fill('#w_printed', '14550');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/11-weighment-entry.png`, fullPage: true });

  // Role matrix grid.
  await page.goto('http://127.0.0.1:3000/administration');
  await page.getByRole('tab', { name: /Role matrix/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/13-role-matrix.png`, fullPage: true });

  // Mobile.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000/weighments');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/14-weighments-mobile.png`, fullPage: true });
});
