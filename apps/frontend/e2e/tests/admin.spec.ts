import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@cualautocompro.cl';
const ADMIN_PASSWORD = 'admin1234';

const uniqueEmail = () =>
  `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

test.describe('admin flow', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore */
      }
    });
  });

  test('link Admin aparece para admin', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill(ADMIN_PASSWORD);
    await page.getByTestId('submit').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: /admin/i })).toBeVisible();
  });

  test('flujo crear → editar → eliminar marca', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill(ADMIN_PASSWORD);
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/admin/brands');
    await expect(page.getByRole('heading', { name: /marcas/i })).toBeVisible();

    const stamp = Date.now();
    const brandName = `TestBrand-${stamp}`;
    const renamedName = `TestBrandRenamed-${stamp}`;

    await page.getByRole('button', { name: /nueva/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /formulario/i }).click();
    await page.locator('input[formControlName="name"]').fill(brandName);
    await page.getByRole('button', { name: /guardar/i }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    const brandRow = page.locator('tr', { hasText: brandName });
    await expect(brandRow).toBeVisible();

    await brandRow.getByRole('button', { name: /editar/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('input[formControlName="name"]').fill(renamedName);
    await page.getByRole('button', { name: /guardar/i }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    const renamedRow = page.locator('tr', { hasText: renamedName });
    await expect(renamedRow).toBeVisible();

    page.once('dialog', (d) => d.accept());
    await renamedRow.getByRole('button', { name: /eliminar/i }).click();

    await expect(renamedRow).toBeHidden();
  });

  test('USER no-admin no ve link Admin y /admin redirige', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'pw-e2e-secure-123';

    await page.goto('/register');
    await page.getByTestId('name').fill('E2E User');
    await page.getByTestId('email').fill(email);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('submit').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: /admin/i })).toBeHidden();

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
  });
});