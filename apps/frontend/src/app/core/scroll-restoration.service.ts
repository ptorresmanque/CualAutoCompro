import { DestroyRef, DOCUMENT, inject, Injectable, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ViewportScroller } from '@angular/common';
import { Router, Scroll } from '@angular/router';
import { filter } from 'rxjs';

/** Cuánto insistimos con la posición antes de rendirnos, en milisegundos. */
const RETRY_BUDGET_MS = 1500;

/** Tolerancia: el navegador redondea, y 2px no los ve nadie. */
const TOLERANCE_PX = 2;

/**
 * Red de contención para `withInMemoryScrolling`.
 *
 * `scrollPositionRestoration: 'enabled'` pide el scroll guardado un tick
 * después del `NavigationEnd`, y ahí el catálogo todavía no pintó la grilla:
 * el documento mide el alto de la ventana y el navegador **recorta** el scroll
 * a 0. Medido en local volviendo de una ficha al catálogo: Angular llamaba
 * `scrollTo({top: 1200})` con `scrollHeight = 800`, y 20 ms más tarde el
 * documento ya medía 3519 sin que nadie volviera a intentarlo. El provider
 * "funcionaba" y la grilla igual aparecía arriba de todo.
 *
 * Acá reintentamos la posición hasta que entre o hasta agotar el presupuesto.
 * Si el usuario mueve el scroll por su cuenta, soltamos: mandar en su lugar es
 * peor que no restaurar nada.
 */
@Injectable({ providedIn: 'root' })
export class ScrollRestorationService {
  private readonly router = inject(Router);
  private readonly viewport = inject(ViewportScroller);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  /** Para que `keepRestoredPosition()` sea idempotente. */
  private wired = false;

  /** Identifica el intento vigente: uno nuevo cancela el anterior. */
  private attempt = 0;

  /**
   * Se llama una sola vez desde el componente raíz `App`, por la misma razón
   * que `PageMetaService.applyRouteDefaults()`: el router ya está construido y
   * todavía no navegó.
   */
  keepRestoredPosition(): void {
    if (this.wired) return;
    this.wired = true;

    this.router.events
      .pipe(
        filter((e): e is Scroll => e instanceof Scroll),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        // `position` solo viene cuando el router está restaurando (volver
        // atrás). En una navegación normal es `null` y no hay nada que cuidar.
        if (event.position) this.insist(event.position);
      });
  }

  private insist(position: [number, number]): void {
    const win = this.document.defaultView;
    if (!win) return;

    const token = ++this.attempt;
    const deadline = win.performance.now() + RETRY_BUDGET_MS;

    const abort = () => {
      if (token === this.attempt) this.attempt++;
    };
    const userEvents = ['wheel', 'touchstart', 'keydown'] as const;
    for (const type of userEvents) {
      win.addEventListener(type, abort, { once: true, passive: true });
    }
    const cleanup = () => {
      for (const type of userEvents) win.removeEventListener(type, abort);
    };

    // Fuera de Angular: son frames de puro scroll, no hay estado que revisar.
    this.zone.runOutsideAngular(() => {
      const tick = () => {
        if (token !== this.attempt) return cleanup();

        const [, top] = position;
        if (Math.abs(win.scrollY - top) <= TOLERANCE_PX) return cleanup();
        if (win.performance.now() > deadline) return cleanup();

        this.viewport.scrollToPosition(position);
        win.requestAnimationFrame(tick);
      };
      tick();
    });
  }
}
