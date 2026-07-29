import { test, expect } from '@playwright/test';

/**
 * End-to-end verification of the master-data slice.
 *
 * TEST_STRATEGY.md: compiling is not evidence, running is. These drive the real
 * browser against the real database.
 */

const BASE = 'http://127.0.0.1:3000';

test('dashboard shows seeded master data counts', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // The suite resets the database first, so these are the seed's exact counts.
  await expect(page.getByTestId('tile-godowns')).toContainText('4');
  await expect(page.getByTestId('tile-commodities')).toContainText('12');
  await expect(page.getByTestId('tile-stacks')).toContainText('7');
  await expect(page.getByTestId('tile-varieties')).toContainText('14');
  await expect(page.getByText('Storage capacity')).toBeVisible();
});

test('creates a godown through the UI and it persists', async ({ page }) => {
  await page.goto(`${BASE}/locations`);
  await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();

  await page.getByRole('button', { name: '+ New location' }).click();

  await page.selectOption('#node_type', 'godown');
  await page.selectOption('#parent_id', { label: 'Aliyabad Facility / Plot 2' });
  await page.fill('#code', 'ALY-G4');
  await page.fill('#name', 'Godown 4');
  await page.fill('#length_m', '55');
  await page.fill('#width_m', '24');
  await page.fill('#height_m', '7.5');
  await page.fill('#approved_capacity_mt', '2400');
  await page.fill('#operational_capacity_mt', '2100');
  await page.fill('#storage_method', 'Bag stacking');

  await page.getByRole('button', { name: 'Create location' }).click();

  // The new godown appears in the tree with its capacities formatted.
  const row = page.locator('tr', { hasText: 'ALY-G4' });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await expect(row).toContainText('Godown');
  await expect(row).toContainText('2,400.000');
  await expect(row).toContainText('2,100.000');

  // Survives a reload — it is in the database, not just React state.
  await page.reload();
  await expect(page.locator('tr', { hasText: 'ALY-G4' })).toBeVisible();
});

test('rejects operational capacity above approved capacity', async ({ page }) => {
  await page.goto(`${BASE}/locations`);
  await page.getByRole('button', { name: '+ New location' }).click();

  await page.selectOption('#node_type', 'godown');
  await page.selectOption('#parent_id', { label: 'Aliyabad Facility / Plot 2' });
  await page.fill('#code', 'ALY-BAD');
  await page.fill('#name', 'Impossible Godown');
  await page.fill('#approved_capacity_mt', '100');
  await page.fill('#operational_capacity_mt', '500');

  await page.getByRole('button', { name: 'Create location' }).click();

  await expect(page.getByTestId('form-notice')).toContainText(
    'Operational capacity cannot exceed approved capacity',
  );
  await expect(page.locator('tr', { hasText: 'ALY-BAD' })).toHaveCount(0);
});

test('rejects a duplicate location code', async ({ page }) => {
  await page.goto(`${BASE}/locations`);
  await page.getByRole('button', { name: '+ New location' }).click();

  await page.selectOption('#node_type', 'godown');
  await page.selectOption('#parent_id', { label: 'Aliyabad Facility / Plot 1' });
  await page.fill('#code', 'ALY-G1');
  await page.fill('#name', 'Duplicate Godown');

  await page.getByRole('button', { name: 'Create location' }).click();

  await expect(page.getByTestId('form-notice')).toContainText('already used');
});

test('creates a commodity through the UI and it persists', async ({ page }) => {
  await page.goto(`${BASE}/commodities`);
  await expect(page.getByRole('heading', { name: 'Commodities' })).toBeVisible();

  await page.getByRole('button', { name: '+ New commodity' }).click();

  await page.fill('#c_code', 'SOYA');
  await page.fill('#c_name', 'Soyabean');
  await page.selectOption('#c_group', { label: 'Cereals' });
  await page.selectOption('#c_unit', { label: 'Quintal' });
  await page.fill('#c_moist', '11.5');
  await page.fill('#c_fum', '75');
  await page.fill('#c_restrict', 'Store away from moisture. Oil content degrades if damp.');

  await page.getByRole('button', { name: 'Create commodity' }).click();

  const row = page.locator('tr', { hasText: 'SOYA' });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await expect(row).toContainText('Soyabean');

  await page.reload();
  await expect(page.locator('tr', { hasText: 'SOYA' })).toBeVisible();
});

test('rejects moisture above 100 percent', async ({ page }) => {
  await page.goto(`${BASE}/commodities`);
  await page.getByRole('button', { name: '+ New commodity' }).click();

  await page.fill('#c_code', 'BADMOIST');
  await page.fill('#c_name', 'Impossible Grain');
  await page.fill('#c_moist', '150');

  await page.getByRole('button', { name: 'Create commodity' }).click();

  // The banner flags that something is wrong; the field says exactly what.
  await expect(page.getByTestId('form-notice')).toContainText(
    'Please correct the highlighted fields',
  );
  await expect(page.getByTestId('error-moisture')).toContainText(
    'Moisture must be between 0 and 100',
  );
});

test('adds a variety to an existing commodity', async ({ page }) => {
  await page.goto(`${BASE}/commodities`);

  // Expand Tur, which already carries Lemon Tur from the seed.
  await page.getByRole('button', { name: 'Tur', exact: true }).click();
  await expect(page.getByText('Lemon Tur')).toBeVisible();

  await page.getByRole('button', { name: '+ Add' }).first().click();
  await page.fill('#v_code', 'MAHARASHTRA');
  await page.fill('#v_name', 'Maharashtra Tur');
  await page.getByRole('button', { name: 'Add variety' }).click();

  await expect(page.getByText('Maharashtra Tur')).toBeVisible({ timeout: 10_000 });
});
