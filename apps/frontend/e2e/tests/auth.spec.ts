import { test, expect } from '@playwright/test';

const uniqueEmail = () =>
  `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

test.describe('auth flow', () => {
  test('registro redirige a / y deja usuario logueado', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'pw-e2e-secure-123';

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible();

    await page.getByTestId('name').fill('E2E User');
    await page.getByTestId('email').fill(email);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('submit').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: /cerrar sesión/i })).toBeVisible();
    await expect(page.getByTestId('email')).toHaveCount(0);
  });

  test('login con credenciales válidas redirige a /', async ({ page, request }) => {
    const email = uniqueEmail();
    const password = 'pw-e2e-secure-123';

    const res = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: { email, password, name: 'E2E Login' },
    });
    expect(res.ok()).toBeTruthy();

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();

    await page.getByTestId('email').fill(email);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('submit').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: /cerrar sesión/i })).toBeVisible();
  });
});