import { test, expect, request } from '@playwright/test';

const uniqueEmail = () =>
  `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

async function fetchVersionIds(count: number): Promise<string[]> {
  const api = await request.newContext({ baseURL: 'http://localhost:3000' });
  const res = await api.get('/api/v1/models', { params: { pageSize: String(count) } });
  if (!res.ok()) {
    throw new Error(`/models returned ${res.status()}: ${await res.text()}`);
  }
  const body = (await res.json()) as {
    data: { items: Array<{ id: string; brand: { name: string }; name: string }> };
  };
  const versionIds: string[] = [];
  for (const m of body.data.items) {
    const detail = await api.get(`/api/v1/models/${m.id}`);
    if (!detail.ok()) {
      throw new Error(`/models/${m.id} returned ${detail.status()}: ${await detail.text()}`);
    }
    const detailBody = (await detail.json()) as {
      data: { versions: Array<{ id: string }> };
    };
    const firstVersion = detailBody.data.versions[0];
    if (!firstVersion) throw new Error(`modelo ${m.id} sin versiones`);
    versionIds.push(firstVersion.id);
    if (versionIds.length === count) break;
  }
  return versionIds;
}

async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<void> {
  const api = await request.newContext({ baseURL: 'http://localhost:3000' });
  const res = await api.post('/api/v1/auth/register', {
    data: { email, password, name },
  });
  expect(res.ok(), `register returned ${res.status()}: ${await res.text()}`).toBeTruthy();
}

test.describe('comparador', () => {
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

  test('agregar 3 versiones y ver 3 cards en /compare', async ({ page }) => {
    const versionIds = await fetchVersionIds(3);

    await page.goto(`/compare?ids=${versionIds.join(',')}`);

    await expect(page.getByTestId('cards')).toBeVisible();
    const cards = page.getByTestId('card');
    await expect.poll(async () => await cards.count(), { timeout: 10_000 }).toBe(3);
  });

  test('guardar comparación devuelve slug accesible', async ({ browser, page }) => {
    const email = uniqueEmail();
    const password = 'pw-e2e-secure-123';
    const name = 'E2E Save';

    await registerUser(email, password, name);

    const versionIds = await fetchVersionIds(3);
    expect(versionIds).toHaveLength(3);

    await page.goto('/login');
    await page.getByTestId('email').fill(email);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto(`/compare?ids=${versionIds.join(',')}`);
    await expect(page.getByTestId('cards')).toBeVisible();
    await expect.poll(async () => await page.getByTestId('card').count(), { timeout: 10_000 }).toBe(3);

    const saveResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/me/comparisons') && r.request().method() === 'POST',
      { timeout: 10_000 },
    );
    await page.getByRole('button', { name: /guardar comparación/i }).click();
    const resp = await saveResponse;
    expect(resp.ok()).toBeTruthy();
    const body = (await resp.json()) as { data: { slug: string } };
    const slug = body.data.slug;
    expect(slug).toMatch(/^[a-z0-9]{4,}$/);

    const apiRes = await page.request.get(`http://localhost:3000/api/v1/comparisons/${slug}`);
    expect(apiRes.ok()).toBeTruthy();
    const apiBody = (await apiRes.json()) as {
      data: { items: Array<{ versionId: string }> };
    };
    expect(apiBody.data.items).toHaveLength(3);
    expect(apiBody.data.items.map((i) => i.versionId).sort()).toEqual([...versionIds].sort());

    const anonCtx = await browser.newContext();
    const anonPage = await anonCtx.newPage();
    await anonPage.goto(`/compare?ids=${versionIds.join(',')}`);
    await expect(anonPage.getByTestId('cards')).toBeVisible();
    await expect.poll(async () => await anonPage.getByTestId('card').count(), { timeout: 10_000 }).toBe(3);
    await anonCtx.close();
  });
});