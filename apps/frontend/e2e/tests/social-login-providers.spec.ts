import { test, expect } from '@playwright/test';

test('sin providers configurados no aparecen botones OAuth', async ({ page }) => {
  // El backend de test no setea envs OAuth → /auth/providers devuelve {google:false, apple:false}
  await page.goto('/login');
  await expect(page.getByTestId('google-login')).toHaveCount(0);
  await expect(page.getByTestId('apple-login')).toHaveCount(0);
});
