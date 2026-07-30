import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RangeSliderComponent } from './range-slider.component';

/**
 * El contrato importante de este componente es *cuándo* emite: el catálogo
 * traduce cada emisión en un `router.navigate` + un GET `/models`, así que
 * arrastrar tiene que emitir una sola vez (al soltar), no una por píxel.
 */
describe('RangeSliderComponent', () => {
  let fixture: ComponentFixture<RangeSliderComponent>;
  let emittedLow: number[];
  let emittedHigh: number[];

  const setup = (dual = false): void => {
    TestBed.configureTestingModule({ imports: [RangeSliderComponent] });
    fixture = TestBed.createComponent(RangeSliderComponent);
    fixture.componentRef.setInput('minBound', 0);
    fixture.componentRef.setInput('maxBound', 100);
    fixture.componentRef.setInput('step', 1);
    fixture.componentRef.setInput('dual', dual);
    fixture.componentRef.setInput('testid', 'rs');
    emittedLow = [];
    emittedHigh = [];
    fixture.componentInstance.lowChange.subscribe((v) => emittedLow.push(v));
    fixture.componentInstance.highChange.subscribe((v) => emittedHigh.push(v));
    fixture.detectChanges();
  };

  const lowInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('[data-testid="rs-low"]');
  const highInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('[data-testid="rs-high"]');
  const values = (): string =>
    fixture.nativeElement.querySelector('[data-testid="rs-values"]').textContent;

  const drag = (el: HTMLInputElement, ...steps: number[]): void => {
    for (const v of steps) {
      el.value = String(v);
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
  };

  const release = (el: HTMLInputElement): void => {
    el.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  it('no emite durante el arrastre', () => {
    setup();
    drag(lowInput(), 10, 20, 30, 40);
    expect(emittedLow).toEqual([]);
  });

  it('refleja el valor en vivo mientras se arrastra', () => {
    setup();
    drag(lowInput(), 10, 42);
    expect(values()).toContain('42');
  });

  it('emite una sola vez al soltar, con el valor final', () => {
    setup();
    const el = lowInput();
    drag(el, 10, 20, 30, 55);
    release(el);
    expect(emittedLow).toEqual([55]);
  });

  it('vuelve a seguir el input del padre después de soltar', () => {
    setup();
    const el = lowInput();
    drag(el, 70);
    release(el);
    fixture.componentRef.setInput('low', 12);
    fixture.detectChanges();
    expect(values()).toContain('12');
  });

  it('clampea al rango y emite el valor clampeado', () => {
    setup();
    const el = lowInput();
    drag(el, 250);
    release(el);
    expect(emittedLow).toEqual([100]);
  });

  it('en modo dual el thumb alto emite por separado', () => {
    setup(true);
    const el = highInput();
    drag(el, 80, 90);
    expect(emittedHigh).toEqual([]);
    release(el);
    expect(emittedHigh).toEqual([90]);
    expect(emittedLow).toEqual([]);
  });
});
