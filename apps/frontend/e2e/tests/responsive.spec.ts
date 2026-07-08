import { test, expect, devices } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4200' });

test.describe('responsive mobile', () => {
  test('hamburger aparece y sidenav abre en /', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const hamburger = page.getByTestId('nav-hamburger');
    await expect(hamburger).toBeVisible();

    await hamburger.click();

    await expect(page.getByRole('link', { name: /^catálogo$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^comparar$/i })).toBeVisible();
  });

  test('hamburger no aparece en desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const hamburger = page.getByTestId('nav-hamburger');
    await expect(hamburger).toBeHidden();

    await expect(page.getByRole('link', { name: /^catálogo$/i })).toBeVisible();
  });

  test('filtros como botón en móvil en /catalogo', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/catalogo');

    const trigger = page.getByTestId('filters-toggle');
    await expect(trigger).toBeVisible();

    const heading = page.getByRole('heading', { name: /filtros/i });
    await expect(heading).toBeHidden();

    await trigger.click();

    await expect(heading).toBeVisible();
  });

  test('admin tabs con scroll horizontal en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await page.getByTestId('email').fill('admin@cualautocompro.cl');
    await page.getByTestId('password').fill('admin1234');
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/admin');

    const tabsScroll = page.locator('.admin-shell-tabs-scroll');
    await expect(tabsScroll).toBeVisible();

    const overflowX = await tabsScroll.evaluate((el) => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');

    await page.context().clearCookies();
  });

  test('no overflow horizontal en landing móvil', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    const overflow = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        htmlScrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });

    expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
  });

  test('no overflow horizontal en catálogo móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/catalogo');

    await page.waitForSelector('[data-testid="catalog-grid"]');

    const overflow = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
  });
});