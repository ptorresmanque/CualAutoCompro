import { test, expect } from '@playwright/test';

test.describe('catálogo', () => {
  test('muestra tarjetas de modelos al cargar', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /filtros/i })).toBeVisible();

    const grid = page.getByTestId('catalog-grid');
    await expect(grid).toBeVisible();

    const cards = grid.locator('li');
    await expect.poll(async () => await cards.count(), { timeout: 10_000 }).toBeGreaterThan(0);
  });

  test('filtro SEDAN aplica y dispara /api/v1/models?segment=SEDAN', async ({ page }) => {
    const sedansRequest = page.waitForRequest(
      (req) =>
        req.url().includes('/api/v1/models') &&
        req.url().includes('segment=SEDAN'),
      { timeout: 10_000 },
    );

    await page.goto('/');

    await page.getByRole('combobox').first().selectOption('SEDAN');

    const req = await sedansRequest;
    expect(req.method()).toBe('GET');

    await expect(page.getByTestId('catalog-grid')).toBeVisible();
    const cards = page.getByTestId('catalog-grid').locator('li');
    await expect.poll(async () => await cards.count(), { timeout: 10_000 }).toBeGreaterThan(0);
  });
});