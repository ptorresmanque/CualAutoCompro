import { test, expect } from '@playwright/test';

/**
 * El skip link tiene que estar escondido pero **enfocable**: se mueve fuera de
 * pantalla con `transform`, nunca con `display: none` ni `visibility: hidden`,
 * que lo sacarían del orden de tabulación y anularían el único motivo por el
 * que existe.
 *
 * Esto va acá y no en un test unitario a propósito: el TestBed no carga
 * `src/styles.css`, así que cualquier aserción de visibilidad hecha en jsdom
 * pasa siempre y no protege nada. Acá el CSS se aplica de verdad.
 */
test.describe('skip link', () => {
  test('el primer Tab lo revela y Enter lleva el foco al contenido', async ({ page }) => {
    await page.goto('/catalogo');

    const skip = page.locator('.skip-link');

    // Escondido, pero presente en el layout: si estuviera en `display: none`
    // no tendría caja y no habría forma de tabular hasta él.
    const box = await skip.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(0);
    expect(box!.y).toBeLessThan(0);

    await page.keyboard.press('Tab');

    // Es el primer elemento enfocable del documento y se hace visible.
    await expect(skip).toBeFocused();
    await expect(skip).toHaveText('Saltar al contenido');
    await expect.poll(async () => (await skip.boundingBox())!.y).toBe(0);

    await page.keyboard.press('Enter');

    // El foco se mueve al contenido, y la URL no cambia: `href="#main"` se
    // resuelve contra el `<base href="/">`, así que sin `preventDefault` esto
    // se iría a la home.
    await expect(page.locator('main#main')).toBeFocused();
    expect(new URL(page.url()).pathname).toBe('/catalogo');

    // El Tab siguiente cae dentro del contenido, no de vuelta en la barra:
    // eso es lo que confirma que el `tabindex="-1"` del <main> hace su trabajo.
    await page.keyboard.press('Tab');
    const dentroDeMain = await page.evaluate(() =>
      document.getElementById('main')!.contains(document.activeElement),
    );
    expect(dentroDeMain).toBe(true);
  });
});
