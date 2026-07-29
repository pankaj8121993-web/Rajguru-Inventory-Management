import { test, expect } from '@playwright/test';

/** Weighment entry and administration, through a real browser. */

const BASE = 'http://127.0.0.1:3000';

test('register shows seeded slips with calculated net weights', async ({ page }) => {
  await page.goto(`${BASE}/weighments`);
  await expect(page.getByRole('heading', { name: 'Weighments' })).toBeVisible();

  // 24,500 − 9,800 = 14,700, computed by the database, not typed.
  const first = page.locator('tr', { hasText: 'IN-202607-0001' });
  await expect(first).toContainText('14,700.000');

  // A slip whose commodity is not yet known is legitimate and clearly marked.
  await expect(page.locator('tr', { hasText: 'IN-202607-0004' }))
    .toContainText('Not yet known');
});

test('calculates net weight live as gross and tare are typed', async ({ page }) => {
  await page.goto(`${BASE}/weighments`);
  await page.getByRole('button', { name: '+ New weighment' }).click();

  await page.fill('#w_gross', '22000');
  await page.fill('#w_tare', '9500');
  await expect(page.getByTestId('calculated-net')).toHaveText('12500.000');

  // The operator has no way to type the net directly — there is no such field.
  await expect(page.locator('input[name="calculated_net_weight_kg"]')).toHaveCount(0);
});

test('flags a net difference beyond tolerance and asks for a reason', async ({ page }) => {
  await page.goto(`${BASE}/weighments`);
  await page.getByRole('button', { name: '+ New weighment' }).click();

  await page.fill('#w_gross', '22000');
  await page.fill('#w_tare', '9500');
  await page.fill('#w_printed', '12300');   // 200 kg out, 1.6% — beyond 0.5%

  const notice = page.getByTestId('net-difference');
  await expect(notice).toContainText('200.000 kg');
  await expect(notice).toContainText('tolerance');
  // The reason field appears only when it is actually needed.
  await expect(page.locator('#w_reason')).toBeVisible();
});

test('does not ask for a reason when the difference is within tolerance', async ({ page }) => {
  await page.goto(`${BASE}/weighments`);
  await page.getByRole('button', { name: '+ New weighment' }).click();

  await page.fill('#w_gross', '22000');
  await page.fill('#w_tare', '9500');
  await page.fill('#w_printed', '12490');   // 10 kg out, 0.08% — within 0.5%

  await expect(page.getByTestId('net-difference')).toContainText('Within');
  await expect(page.locator('#w_reason')).toHaveCount(0);
});

test('creates a weighment and generates its slip number', async ({ page }) => {
  await page.goto(`${BASE}/weighments`);
  await page.getByRole('button', { name: '+ New weighment' }).click();

  await page.fill('#w_ext', 'KP-9001');
  await page.fill('#w_gross', '19800');
  await page.fill('#w_tare', '8400');
  await page.fill('#w_printed', '11400');
  await page.selectOption('#w_commodity', { label: 'Tur' });
  await page.selectOption('#w_variety', { label: 'Lemon Tur' });

  await page.getByRole('button', { name: 'Save weighment' }).click();

  await expect(page.getByTestId('form-notice')).toContainText('saved as draft');
  await page.reload();
  await expect(page.locator('tr', { hasText: 'KP-9001' })).toBeVisible();
});

test('rejects a gross weight below tare', async ({ page }) => {
  await page.goto(`${BASE}/weighments`);
  await page.getByRole('button', { name: '+ New weighment' }).click();

  await page.fill('#w_gross', '5000');
  await page.fill('#w_tare', '9000');
  await page.getByRole('button', { name: 'Save weighment' }).click();

  await expect(page.getByTestId('error-gross'))
    .toContainText('greater than tare');
});

test('flags a possible duplicate without merging or discarding it', async ({ page }) => {
  await page.goto(`${BASE}/weighments`);
  await page.getByRole('button', { name: '+ New weighment' }).click();

  // Same paper slip number, weighbridge and weights as a seeded slip.
  await page.fill('#w_ext', 'KP-4471');
  await page.selectOption('#w_wb', { label: 'Aliyabad Weighbridge 1' });
  await page.fill('#w_gross', '24500');
  await page.fill('#w_tare', '9800');

  await page.getByRole('button', { name: 'Save weighment' }).click();

  const warning = page.getByTestId('duplicate-warning');
  await expect(warning).toBeVisible({ timeout: 10_000 });
  await expect(warning).toContainText('IN-202607-0001');
  await expect(warning).toContainText('Nothing was merged or discarded');
});

test('administration shows the role matrix and scoped assignments', async ({ page }) => {
  await page.goto(`${BASE}/administration`);
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();

  // The honest banner about authentication not existing yet.
  await expect(page.getByText('authentication is not built yet')).toBeVisible();

  // Blueprint §5.1's example: Ramesh holds three roles at three scopes.
  const ramesh = page.locator('section', { hasText: 'Ramesh Patil' }).first();
  await expect(ramesh).toContainText('Warehouse Supervisor');
  await expect(ramesh).toContainText('Fumigation Approver');
  await expect(ramesh).toContainText('All facilities');
});

test('role matrix shows Super Administrator without override authority', async ({ page }) => {
  await page.goto(`${BASE}/administration`);
  await page.getByRole('tab', { name: /Role matrix/ }).click();

  // The sentence is split by a <strong>, so match the paragraph as a whole.
  await expect(page.locator('p', { hasText: 'Super Administrator' }).first())
    .toContainText('does not');
  await expect(page.getByRole('heading', { name: 'governance' })).toBeVisible();
});

test('assigns a role at a scope', async ({ page }) => {
  await page.goto(`${BASE}/administration`);
  await page.getByRole('button', { name: '+ Assign a role' }).click();

  await page.selectOption('#a_user', { label: 'Prakash Jadhav (EMP004)' });
  await page.selectOption('#a_role', { label: 'Quality Inspector' });
  await page.selectOption('#a_scope', { label: 'Murud Facility' });

  await page.getByRole('button', { name: 'Assign role' }).click();

  await expect(page.getByTestId('form-notice').first()).toContainText('Role assigned');
  const prakash = page.locator('section', { hasText: 'Prakash Jadhav' }).first();
  await expect(prakash).toContainText('Quality Inspector');
});

test('refuses the same role at the same scope twice', async ({ page }) => {
  await page.goto(`${BASE}/administration`);
  await page.getByRole('button', { name: '+ Assign a role' }).click();

  await page.selectOption('#a_user', { label: 'Sunita Deshmukh (EMP002)' });
  await page.selectOption('#a_role', { label: 'Stock Accountant' });
  // Seeded unscoped; assigning it again unscoped is a duplicate.

  await page.getByRole('button', { name: 'Assign role' }).click();

  await expect(page.getByTestId('form-notice').first())
    .toContainText('already holds that role');
});
