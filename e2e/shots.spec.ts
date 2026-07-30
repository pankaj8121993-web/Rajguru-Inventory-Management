import { test } from '@playwright/test';
const OUT = '/workspace/shots';
test('capture screens', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  for (const [name, path] of [
    ['new-1-dashboard', '/'],
    ['new-2-weighments', '/weighments'],
    ['new-3-locations', '/locations'],
    ['new-4-parties', '/parties'],
    ['new-5-admin', '/administration'],
  ] as const) {
    await page.goto(`http://127.0.0.1:3000${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/new-6-mobile.png`, fullPage: true });
});
