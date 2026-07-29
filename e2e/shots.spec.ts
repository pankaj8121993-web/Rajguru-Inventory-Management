import { test } from '@playwright/test';

/** Captures screenshots of the running app for review. Not an assertion suite. */
const OUT = '/workspace/shots';

test('capture screens', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const [name, path] of [
    ['1-dashboard', '/'],
    ['2-locations', '/locations'],
    ['4-commodities', '/commodities'],
    ['6-parties', '/parties'],
    ['7-vehicles', '/vehicles'],
    ['8-reason-codes', '/reason-codes'],
  ] as const) {
    await page.goto(`http://127.0.0.1:3000${path}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  }

  // Mobile — the primary device for yard staff.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000/parties');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/9-parties-mobile.png`, fullPage: true });
});
