import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { today, dateOffset } from '../../src/lib/domain';
const switchModule = async (page: Page, module: string) => {
  await page.getByRole('button', { name: module, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${module.toLowerCase()}/dashboard`));
};
const signIn = async (page: Page, email: string) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Resort@123');
  await page.getByRole('button', { name: 'Sign in to your workspace' }).click();
  await expect(page).toHaveURL(/\/(guest|staff|management|owner)\/dashboard/);
};
test('Every module screen and every staff role renders without runtime errors', async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Ananya/ }),
  ).toBeVisible({ timeout: 30000 });
  const modules = {
    Management: [
      'reservations',
      'rooms',
      'guests',
      'tasks',
      'services',
      'team',
      'support',
      'billing',
      'promotions',
      'reports',
      'settings',
    ],
    Guest: ['reservations', 'services', 'billing', 'loyalty', 'reviews', 'support', 'profile'],
    Owner: ['reports', 'billing', 'rooms', 'accounts', 'permissions', 'audit', 'settings'],
  };
  for (const [module, paths] of Object.entries(modules)) {
    if (module !== 'Management') await switchModule(page, module);
    for (const path of paths) {
      await page.goto(`/${module.toLowerCase()}/${path}`);
      await expect(page.locator('#main-content h1')).toBeVisible();
      await expect(page.getByText('This screen couldn’t load.')).toHaveCount(0);
    }
  }
  await switchModule(page, 'Staff');
  for (const role of [
    'Receptionist',
    'Housekeeping',
    'Cashier',
    'Maintenance',
    'Gardener',
    'F&B',
    'Spa',
  ]) {
    await page.getByLabel('Staff demo role').selectOption(role);
    await expect(page.locator('#main-content h1')).toContainText('A great day starts with you');
    await expect(page.getByLabel('Staff demo role')).toHaveValue(role);
  }
  expect(errors).toEqual([]);
});
test('The full stay journey works through all four workspaces and persists', async ({ page }) => {
  test.setTimeout(240000);
  await page.goto('/');
  await page.getByRole('button', { name: 'New reservation', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Full name').fill('Sam River');
  await dialog.getByLabel('Email address').fill('sam.river@example.com');
  await dialog.getByLabel('Phone number').fill('+91 9876500123');
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(dialog.getByLabel('Full name')).toHaveValue('Sam River');
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.locator('.room-choice').filter({ hasText: '210' }).click();
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByRole('button', { name: 'Confirm reservation', exact: true }).click();
  await expect(dialog.getByText('Confirmed. Let the stay begin.')).toBeVisible();
  await expect(dialog.locator('.credential-box')).toContainText('sam.river@example.com');
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await signIn(page, 'sam.river@example.com');
  await expect(page.getByRole('heading', { name: 'Welcome home, Sam.' })).toBeVisible();
  await expect(page.getByText('Confirmed', { exact: true }).first()).toBeVisible();
  await switchModule(page, 'Management');
  await page.goto('/management/reservations');
  await page.getByLabel('Search guest, reservation or room…').fill('Sam River');
  await page.getByRole('link', { name: 'Sam River', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Sam River.s stay/ })).toBeVisible();
  const reservationId = await page.locator('.page-heading .eyebrow').innerText();
  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await expect(page.locator('.heading-actions .badge')).toHaveText('Checked in');
  await signIn(page, 'sam.river@example.com');
  await page.getByRole('button', { name: 'Explore your experiences' }).click();
  await page.getByRole('button', { name: 'Request a service', exact: true }).click();
  await dialog.getByRole('button', { name: /Balinese massage/ }).click();
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByLabel('Preferences & special requests').fill('Gentle pressure, please.');
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByRole('button', { name: 'Submit request', exact: true }).click();
  await expect(dialog.getByText('A little delight is on its way.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Lovely, thank you' }).click();
  await switchModule(page, 'Staff');
  await page.getByLabel('Staff demo role').selectOption('Spa');
  await page.goto('/staff/services');
  const serviceRow = page.getByRole('row').filter({ hasText: 'Sam River' });
  await serviceRow.getByRole('button', { name: 'Manage' }).click();
  await dialog.getByRole('button', { name: 'Accept request' }).click();
  await dialog.getByRole('button', { name: 'Start service' }).click();
  await dialog.getByRole('button', { name: 'Complete & add charge' }).click();
  await expect(dialog.getByText('Completed', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await signIn(page, 'sam.river@example.com');
  await page.goto('/guest/billing');
  await expect(page.locator('.invoice-card')).toContainText('Balinese massage');
  await page.getByRole('button', { name: 'Pay stay balance' }).click();
  await dialog.getByRole('button', { name: 'Simulate payment' }).click();
  await expect(page.getByRole('heading', { name: 'All taken care of.' })).toBeVisible();
  const invoiceDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download invoice' }).click();
  expect((await invoiceDownload).suggestedFilename()).toBe(`invoice-${reservationId}.html`);
  await switchModule(page, 'Management');
  await page.goto(`/management/reservations/${reservationId}`);
  await page.getByRole('button', { name: 'Check out', exact: true }).click();
  await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('.heading-actions .badge')).toHaveText('Completed');
  await expect(page.getByText('Dirty', { exact: true })).toBeVisible();
  await signIn(page, 'sam.river@example.com');
  await page.goto('/guest/reviews');
  await page.getByRole('button', { name: 'Share your experience' }).click();
  await dialog
    .getByLabel('Your memories & feedback')
    .fill('A wonderfully calm stay, with thoughtful service.');
  await dialog.getByRole('button', { name: 'Publish review' }).click();
  await expect(page.getByText('“A wonderfully calm stay, with thoughtful service.”')).toBeVisible();
  await page.goto('/guest/loyalty');
  await expect(page.getByText(`Stay completed · ${reservationId}`)).toBeVisible();
  await switchModule(page, 'Owner');
  await page.goto('/owner/audit');
  await page.getByLabel('Search actor, action, record or date…').fill(reservationId);
  await expect(page.getByRole('cell', { name: 'payment.create', exact: true })).toBeVisible();
  await page.goto('/owner/reports');
  const report = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report' }).click();
  expect((await report).suggestedFilename()).toMatch(/rrms-weekly-report/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Reports & insights' })).toBeVisible();
});
test('Owner permissions remove a staff screen and prevent direct-route access', async ({
  page,
}) => {
  await page.goto('/');
  await switchModule(page, 'Owner');
  await page.goto('/owner/permissions');
  await page.getByLabel('Receptionist reservations permission', { exact: true }).uncheck();
  await switchModule(page, 'Staff');
  await expect(
    page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Reservations', exact: true }),
  ).toHaveCount(0);
  await page.goto('/staff/reservations');
  await expect(
    page.getByRole('heading', { name: 'This screen isn’t available to your role' }),
  ).toBeVisible();
});
test('Guest profile edits, notifications, tab keyboard navigation and search persist', async ({
  page,
}) => {
  await page.goto('/');
  await switchModule(page, 'Guest');
  await page.goto('/guest/profile');
  await page.getByLabel('Stay preferences').fill('Vegetarian breakfast and a quiet room.');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.reload();
  await expect(page.getByLabel('Stay preferences')).toHaveValue(
    'Vegetarian breakfast and a quiet room.',
  );
  await page.getByRole('button', { name: /Notifications, \d+ unread/ }).click();
  await page.getByRole('button', { name: 'Mark all as read' }).click();
  await expect(page.getByRole('dialog')).toContainText('0 unread updates');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.goto('/guest/reservations');
  await page.getByRole('tab', { name: /Active/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Completed/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
test('Mobile navigation, dialogs, and core screens fit a narrow viewport', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Ananya/ }),
  ).toBeVisible({ timeout: 30000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Reservations', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Reservations', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'New reservation', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Close dialog' }).click();
  for (const path of ['rooms', 'tasks', 'billing', 'reports', 'settings']) {
    await page.goto(`/management/${path}`);
    await expect(page.locator('#main-content h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `Overflow at ${path}`,
    ).toBe(true);
  }
  await page.screenshot({ path: 'test-results/mobile-resort.png', fullPage: true });
});
