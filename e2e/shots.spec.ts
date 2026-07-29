import { test } from '@playwright/test';

/** Captures screenshots of the running app for review. Not an assertion suite. */
const OUT = '/workspace/shots';

test('capture screens', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('http://127.0.0.1:3000/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/1-dashboard.png`, fullPage: true });

  await page.goto('http://127.0.0.1:3000/locations');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/2-locations.png`, fullPage: true });

  await page.getByRole('button', { name: '+ New location' }).click();
  await page.selectOption('#node_type', 'godown');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/3-new-location-form.png`, fullPage: true });

  await page.goto('http://127.0.0.1:3000/commodities');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Tur', exact: true }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/4-commodities.png`, fullPage: true });

  // Mobile — the primary device for yard staff.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000/locations');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/5-locations-mobile.png`, fullPage: true });
});
