import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
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

  readonly lowEffective = computed<number>(() => {
    const l = this.low();
    return l === undefined ? this.minBound() : l;
  });

  readonly highEffective = computed<number>(() => {
    const h = this.high();
    const l = this.lowEffective();
    const min = this.minBound();
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

  onLowInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    const raw = Number(target.value);
    const min = this.minBound();
    const max = this.maxBound();
    if (Number.isNaN(raw)) return;
    const v = Math.min(Math.max(raw, min), max);
    target.value = String(v);
    this.lowChange.emit(v);
  }

  onHighInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    const raw = Number(target.value);
    const min = this.minBound();
    const max = this.maxBound();
    if (Number.isNaN(raw)) return;
    const v = Math.min(Math.max(raw, min), max);
    target.value = String(v);
    this.highChange.emit(v);
  }
}
