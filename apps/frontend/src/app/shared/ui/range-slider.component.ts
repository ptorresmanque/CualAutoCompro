import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-range-slider',
  standalone: true,
  imports: [NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './range-slider.component.html',
  styleUrl: './range-slider.component.css',
})
export class RangeSliderComponent {
  readonly minBound = input.required<number>();
  readonly maxBound = input.required<number>();
  readonly step = input<number>(1);
  readonly low = input<number | undefined>(undefined);
  readonly high = input<number | undefined>(undefined);
  readonly dual = input<boolean>(false);
  readonly testid = input<string | null>(null);
  readonly label = input<string>('');
  readonly format = input<(v: number) => string>((v) => String(v));

  readonly lowChange = output<number>();
  readonly highChange = output<number>();

  /**
   * Valor mientras el usuario arrastra, antes de soltar. Existe para separar el
   * feedback visual (continuo, en `input`) de la emisión al padre (una sola vez,
   * en `change`): con la emisión en `input`, cada píxel de arrastre disparaba un
   * `router.navigate` + un GET `/models` en el catálogo.
   *
   * `null` = no hay arrastre en curso y manda el valor que llega por input.
   */
  private readonly draftLow = signal<number | null>(null);
  private readonly draftHigh = signal<number | null>(null);

  readonly lowEffective = computed<number>(() => {
    const draft = this.draftLow();
    if (draft !== null) return draft;
    const l = this.low();
    return l === undefined ? this.minBound() : l;
  });

  readonly highEffective = computed<number>(() => {
    const draft = this.draftHigh();
    const h = draft !== null ? draft : this.high();
    const l = this.lowEffective();
    const max = this.maxBound();
    if (h === undefined) return max;
    if (!this.dual()) return l;
    return Math.max(h, l);
  });

  readonly lowPercent = computed<number>(() => {
    const span = this.maxBound() - this.minBound();
    if (span <= 0) return 0;
    return ((this.lowEffective() - this.minBound()) / span) * 100;
  });

  readonly highPercent = computed<number>(() => {
    const span = this.maxBound() - this.minBound();
    if (span <= 0) return 100;
    return ((this.highEffective() - this.minBound()) / span) * 100;
  });

  displayLow(): string {
    return this.format()(this.lowEffective());
  }

  displayHigh(): string {
    return this.format()(this.highEffective());
  }

  /** Arrastre en curso: solo actualiza el valor visible. */
  onLowInput(e: Event): void {
    const v = this.clampFromEvent(e);
    if (v !== null) this.draftLow.set(v);
  }

  /** Arrastre en curso: solo actualiza el valor visible. */
  onHighInput(e: Event): void {
    const v = this.clampFromEvent(e);
    if (v !== null) this.draftHigh.set(v);
  }

  /**
   * El usuario soltó (o movió con el teclado): acá sí se emite. El draft se
   * limpia **después** de emitir, porque `emit` corre el handler del padre de
   * forma sincrónica y así el input ya trae el valor nuevo cuando se renderiza.
   */
  onLowCommit(e: Event): void {
    const v = this.clampFromEvent(e) ?? this.lowEffective();
    this.lowChange.emit(v);
    this.draftLow.set(null);
  }

  onHighCommit(e: Event): void {
    const v = this.clampFromEvent(e) ?? this.highEffective();
    this.highChange.emit(v);
    this.draftHigh.set(null);
  }

  private clampFromEvent(e: Event): number | null {
    const target = e.target as HTMLInputElement;
    const raw = Number(target.value);
    if (Number.isNaN(raw)) return null;
    const v = Math.min(Math.max(raw, this.minBound()), this.maxBound());
    target.value = String(v);
    return v;
  }
}
