import { test, expect } from '@playwright/test';

/**
 * End-to-end verification of the party, vehicle and reason-code masters.
 *
 * These drive the real browser against the real database.
 */

const BASE = 'http://127.0.0.1:3000';

test('parties list shows seeded parties with their multiple types', async ({ page }) => {
  await page.goto(`${BASE}/parties`);
  await expect(page.getByRole('heading', { name: 'Parties' })).toBeVisible();

  // Shree Balaji Traders holds both Trader and Customer.
  const balaji = page.locator('tr', { hasText: 'Shree Balaji Traders' });
  await expect(balaji).toBeVisible();
  await expect(balaji).toContainText('Trader');
  await expect(balaji).toContainText('Customer');
});

test('creates a farmer with no GSTIN or PAN', async ({ page }) => {
  await page.goto(`${BASE}/parties`);
  await page.getByRole('button', { name: '+ New party' }).click();

  await page.fill('#p_code', 'P0200');
  await page.fill('#p_legal', 'Dattatray Maruti Kale');
  // A farmer at the mandi gate frequently has neither identifier.
  await page.getByTestId('party-types').getByText('Farmer', { exact: true }).click();
  await page.fill('#p_mobile', '+91 98220 55001');
  await page.fill('#p_village', 'Ausa');
  await page.fill('#p_district', 'Latur');

  await page.getByRole('button', { name: 'Create party' }).click();

  const row = page.locator('tr', { hasText: 'Dattatray Maruti Kale' });
  await expect(row).toBeVisible({ timeout: 10_000 });
  // The mobile was normalised to bare 10 digits on the way in.
  await expect(row).toContainText('9822055001');

  await page.reload();
  await expect(page.locator('tr', { hasText: 'Dattatray Maruti Kale' })).toBeVisible();
});

test('requires at least one party type', async ({ page }) => {
  await page.goto(`${BASE}/parties`);
  await page.getByRole('button', { name: '+ New party' }).click();

  await page.fill('#p_code', 'P0201');
  await page.fill('#p_legal', 'Typeless Party');
  await page.getByRole('button', { name: 'Create party' }).click();

  await expect(page.getByTestId('error-types')).toContainText('at least one party type');
  await expect(page.locator('tr', { hasText: 'Typeless Party' })).toHaveCount(0);
});

test('rejects a malformed GSTIN', async ({ page }) => {
  await page.goto(`${BASE}/parties`);
  await page.getByRole('button', { name: '+ New party' }).click();

  await page.fill('#p_code', 'P0202');
  await page.fill('#p_legal', 'Bad GSTIN Traders');
  await page.getByTestId('party-types').getByText('Trader', { exact: true }).click();
  await page.fill('#p_gstin', '27AABCK1234M1Z');

  await page.getByRole('button', { name: 'Create party' }).click();

  await expect(page.getByTestId('error-gstin')).toContainText('15 characters');
  await expect(page.locator('tr', { hasText: 'Bad GSTIN Traders' })).toHaveCount(0);
});

test('rejects a malformed mobile number', async ({ page }) => {
  await page.goto(`${BASE}/parties`);
  await page.getByRole('button', { name: '+ New party' }).click();

  await page.fill('#p_code', 'P0203');
  await page.fill('#p_legal', 'Bad Mobile Traders');
  await page.getByTestId('party-types').getByText('Trader', { exact: true }).click();
  await page.fill('#p_mobile', '1234567890');

  await page.getByRole('button', { name: 'Create party' }).click();

  await expect(page.getByTestId('error-mobile')).toContainText('10-digit Indian mobile');
});

test('filters parties by type', async ({ page }) => {
  await page.goto(`${BASE}/parties`);

  await page.selectOption('#ptype', { label: 'Transporter' });
  await page.waitForLoadState('networkidle');

  // Both seeded transporters, and no farmers.
  await expect(page.locator('tr', { hasText: 'Siddhi Vinayak Roadlines' })).toBeVisible();
  await expect(page.locator('tr', { hasText: 'Om Sai Transport' })).toBeVisible();
  await expect(page.locator('tr', { hasText: 'Sanjay Bhaurao Patil' })).toHaveCount(0);
});

test('creates a vehicle and normalises its registration', async ({ page }) => {
  await page.goto(`${BASE}/vehicles`);
  await expect(page.getByRole('heading', { name: 'Vehicles' })).toBeVisible();

  await page.getByRole('button', { name: '+ New vehicle' }).click();
  await page.fill('#v_reg', 'mh 24 xy 7788');
  await page.fill('#v_type', 'Truck 6-wheeler');
  await page.selectOption('#v_transporter', {
    label: 'Siddhi Vinayak Roadlines (P0010)',
  });
  await page.fill('#v_cap', '9.5');
  await page.fill('#v_insurance_valid_to', '2027-12-31');

  await page.getByRole('button', { name: 'Add vehicle' }).click();

  const row = page.locator('tr', { hasText: 'MH24XY7788' });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await expect(row).toContainText('9.500');
  await expect(row).toContainText('Siddhi Vinayak Roadlines');
});

test('rejects a malformed vehicle registration', async ({ page }) => {
  await page.goto(`${BASE}/vehicles`);
  await page.getByRole('button', { name: '+ New vehicle' }).click();

  await page.fill('#v_reg', 'NOTAREG');
  await page.getByRole('button', { name: 'Add vehicle' }).click();

  await expect(page.getByTestId('error-registration')).toContainText('MH24AB1234');
});

test('warns about expired vehicle documents without blocking them', async ({ page }) => {
  await page.goto(`${BASE}/vehicles`);

  // The seed deliberately includes a vehicle with a lapsed certificate.
  await expect(page.getByText(/expired document/)).toBeVisible();
  // It is still listed and still editable — the expiry warns, it does not hide.
  await expect(page.locator('tr', { hasText: 'MH12IJ2345' })).toBeVisible();
});

test('reason codes are grouped by category with their controls', async ({ page }) => {
  await page.goto(`${BASE}/reason-codes`);
  await expect(page.getByRole('heading', { name: 'Reason codes' })).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Gain' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Loss' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Correction' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reclassification' })).toBeVisible();

  // Theft requires evidence and approval, and is an exception.
  const theft = page.locator('tr', { hasText: 'Theft' });
  await expect(theft).toContainText('Evidence');
  await expect(theft).toContainText('Approval');
  await expect(theft).toContainText('Exception');
});

test('adds a reason code', async ({ page }) => {
  await page.goto(`${BASE}/reason-codes`);
  await page.getByRole('button', { name: '+ New reason code' }).click();

  await page.selectOption('#r_cat', { label: 'Damage' });
  await page.fill('#r_code', 'FORKLIFT');
  await page.fill('#r_name', 'Forklift damage');
  await page.check('input[name="requires_evidence"]');

  await page.getByRole('button', { name: 'Add reason code' }).click();

  const row = page.locator('tr', { hasText: 'Forklift damage' });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await expect(row).toContainText('Evidence');
});

test('dashboard counts the new masters', async ({ page }) => {
  await page.goto(BASE);

  // Earlier tests in this file add parties, vehicles and reason codes, so these
  // assert "at least the seeded count" rather than an exact number that would
  // depend on test order.
  const atLeast = async (testId: string, minimum: number) => {
    const text = (await page.getByTestId(testId).innerText()).replace(/[^0-9]/g, '');
    expect(Number(text)).toBeGreaterThanOrEqual(minimum);
  };

  await atLeast('tile-parties', 15);
  await atLeast('tile-vehicles', 6);
  await atLeast('tile-reason-codes', 53);
  // Employees are never mutated by these tests, so this one is exact.
  await expect(page.getByTestId('tile-employees')).toContainText('7');
});
