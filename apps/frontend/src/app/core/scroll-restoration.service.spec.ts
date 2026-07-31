import { TestBed } from '@angular/core/testing';
import { ViewportScroller } from '@angular/common';
import { Router, Scroll } from '@angular/router';
import { Subject } from 'rxjs';
import { ScrollRestorationService } from './scroll-restoration.service';

/**
 * Doble del scroll de la ventana con el recorte que hace el navegador de
 * verdad: no podés bajar más allá de `documentHeight - viewportHeight`. Ese
 * recorte es justo el que rompía la restauración cuando el contenido llega
 * después de la navegación.
 */
class ViewportStub {
  documentHeight = 800;
  readonly viewportHeight = 800;
  y = 0;
  calls: number[] = [];

  getScrollPosition(): [number, number] {
    return [0, this.y];
  }

  scrollToPosition(position: [number, number]): void {
    this.calls.push(position[1]);
    const max = Math.max(0, this.documentHeight - this.viewportHeight);
    this.y = Math.min(position[1], max);
  }
}

class RouterStub {
  readonly events = new Subject<unknown>();
}

/** Corre los `requestAnimationFrame` pendientes, hasta `max` rondas. */
function flushFrames(max = 20): void {
  for (let i = 0; i < max; i++) {
    const pending = rafQueue.splice(0, rafQueue.length);
    if (pending.length === 0) return;
    for (const cb of pending) cb(0);
  }
}

let rafQueue: FrameRequestCallback[] = [];
let originalRaf: typeof window.requestAnimationFrame;

describe('ScrollRestorationService', () => {
  let viewport: ViewportStub;
  let router: RouterStub;
  let service: ScrollRestorationService;

  beforeEach(() => {
    rafQueue = [];
    originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    }) as typeof window.requestAnimationFrame;

    // El servicio lee `window.scrollY`, no el stub: lo espejamos.
    viewport = new ViewportStub();
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => viewport.y,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ViewportScroller, useValue: viewport },
      ],
    });
    router = TestBed.inject(Router) as unknown as RouterStub;
    service = TestBed.inject(ScrollRestorationService);
    service.keepRestoredPosition();
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRaf;
  });

  const scrollEvent = (position: [number, number] | null) =>
    new Scroll({ id: 1, url: '/catalogo', urlAfterRedirects: '/catalogo' } as never, position, null);

  it('reintenta hasta que el contenido asíncrono da altura suficiente', () => {
    router.events.next(scrollEvent([0, 1200]));

    // Primer intento con el documento todavía vacío: el navegador lo recorta.
    expect(viewport.calls).toEqual([1200]);
    expect(window.scrollY).toBe(0);

    // Llega la grilla del catálogo y el documento crece.
    viewport.documentHeight = 3500;
    flushFrames();

    expect(window.scrollY).toBe(1200);
  });

  it('no toca el scroll cuando la navegación no trae posición guardada', () => {
    router.events.next(scrollEvent(null));
    flushFrames();

    expect(viewport.calls).toEqual([]);
  });

  it('deja de insistir cuando el usuario mueve el scroll', () => {
    router.events.next(scrollEvent([0, 1200]));
    expect(viewport.calls.length).toBe(1);

    window.dispatchEvent(new Event('wheel'));
    viewport.documentHeight = 3500;
    flushFrames();

    // Nada más: mandar por sobre el usuario es peor que no restaurar.
    expect(viewport.calls.length).toBe(1);
    expect(window.scrollY).toBe(0);
  });
});
