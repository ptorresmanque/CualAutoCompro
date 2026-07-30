import { test, expect } from '@playwright/test';

test.describe('catálogo', () => {
  test('muestra tarjetas de modelos al cargar /catalogo', async ({ page }) => {
    await page.goto('/catalogo');

    await expect(page.getByRole('heading', { name: /filtros/i })).toBeVisible();

    const grid = page.getByTestId('catalog-grid');
    await expect(grid).toBeVisible();

    const cards = grid.locator('li');
    await expect.poll(async () => await cards.count(), { timeout: 10_000 }).toBeGreaterThan(0);
  });

  // El filtro de segmento es multi-selección (checkbox), no un <select> ni un
  // radio: este test usaba `getByRole('combobox').first().selectOption('SEDAN')`,
  // que apuntaba al mat-select de "Marca" y encima no funciona sobre un select
  // no nativo.
  test('filtro SEDAN aplica y dispara /api/v1/models?segment=SEDAN', async ({ page }) => {
    const sedansRequest = page.waitForRequest(
      (req) =>
        req.url().includes('/api/v1/models') &&
        req.url().includes('segment=SEDAN'),
      { timeout: 10_000 },
    );

    await page.goto('/catalogo');

    await page.getByRole('checkbox', { name: 'Sedán', exact: true }).click();

    const req = await sedansRequest;
    expect(req.method()).toBe('GET');

    await expect(page.getByTestId('catalog-grid')).toBeVisible();
    const cards = page.getByTestId('catalog-grid').locator('li');
    await expect.poll(async () => await cards.count(), { timeout: 10_000 }).toBeGreaterThan(0);
  });

  test('marcar dos segmentos manda los dos y muestra un chip por cada uno', async ({ page }) => {
    await page.goto('/catalogo');

    await page.getByRole('checkbox', { name: 'Sedán', exact: true }).click();
    const bothRequest = page.waitForRequest(
      (req) =>
        req.url().includes('/api/v1/models') &&
        decodeURIComponent(req.url()).includes('segment=SEDAN,HATCHBACK'),
      { timeout: 10_000 },
    );
    await page.getByRole('checkbox', { name: 'Hatchback', exact: true }).click();
    await bothRequest;

    const chips = page.getByTestId('active-filters');
    await expect(chips).toBeVisible();
    await expect(page.getByTestId('active-filter-segment:SEDAN')).toBeVisible();
    await expect(page.getByTestId('active-filter-segment:HATCHBACK')).toBeVisible();

    // Quitar un chip deja el otro filtro en pie.
    await page.getByTestId('active-filter-segment:SEDAN').click();
    await expect(page.getByTestId('active-filter-segment:SEDAN')).toHaveCount(0);
    await expect(page.getByTestId('active-filter-segment:HATCHBACK')).toBeVisible();
  });

  test('la búsqueda por texto filtra y queda en la URL', async ({ page }) => {
    await page.goto('/catalogo');

    const searchRequest = page.waitForRequest(
      (req) => req.url().includes('/api/v1/models') && req.url().includes('q=corolla'),
      { timeout: 10_000 },
    );
    await page.getByTestId('catalog-search').getByRole('textbox').fill('corolla');
    await searchRequest;

    await expect(page).toHaveURL(/q=corolla/);
    await expect(page.getByTestId('results-count')).toContainText(/modelo/i);
  });
});

test.describe('landing', () => {
  test('muestra hero con H1 y CTAs en /', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /compara autos en chile/i }),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="hero-explore"]'),
    ).toHaveAttribute('href', '/catalogo');
    await expect(
      page.locator('[data-testid="hero-compare"]'),
    ).toHaveAttribute('href', '/compare');
  });
});