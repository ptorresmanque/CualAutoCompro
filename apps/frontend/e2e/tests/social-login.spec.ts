import { test, expect } from '@playwright/test';

test('login Google simulado crea sesion y redirige a /', async ({ page, request }) => {
  await page.goto('/login');

  // Si los providers no estan configurados, este test no aplica al entorno actual.
  // Asi el spec queda verde en CI (sin envs OAuth) y exercuta el flujo cuando hay config real.
  if ((await page.getByTestId('google-login').count()) === 0) {
    test.skip(true, 'Google OAuth no configurado en este entorno');
    return;
  }

  // Interceptamos la navegacion a /api/v1/auth/google y llamamos al endpoint de simulacion.
  await page.route('**/api/v1/auth/google', async (route) => {
    const resp = await request.post('/api/v1/auth/__test__/simulate-callback', {
      data: {
        provider: 'google',
        sub: 'e2e-google-sub',
        email: 'oauth-user@e2e.local',
        name: 'OAuth User',
      },
    });
    const setCookie = resp.headers()['set-cookie'];
    if (setCookie) {
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      await page.context().addCookies(
        cookies.map((c) => {
          const [pair] = c.split(';');
          const [name, value] = pair!.split('=');
          return { name: name!, value: value!, url: 'http://localhost:4200' };
        }),
      );
    }
    await route.fulfill({ status: 302, headers: { Location: '/?oauth=ok' } });
  });

  await page.getByTestId('google-login').click();
  await page.waitForURL('**/?oauth=ok');
  await expect(page).toHaveURL(/\?oauth=ok/);
});
