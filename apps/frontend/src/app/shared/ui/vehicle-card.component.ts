import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgStyle } from '@angular/common';

export interface VehicleCardInput {
  id: string;
  name: string;
  segment: string;
  brand: { name: string };
  imageUrl?: string | null;
  minPrice: number | null;
  defaultVersion?: {
    id: string;
    name: string;
    priceClp: number;
    year: number;
  } | null;
}

@Component({
  selector: 'app-vehicle-card',
  imports: [NgStyle],
  templateUrl: './vehicle-card.component.html',
  styleUrl: './vehicle-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleCardComponent {
  readonly model = input.required<VehicleCardInput>();
  readonly featured = input<boolean>(false);
  readonly added = input<boolean>(false);
  readonly maxReached = input<boolean>(false);
  readonly compareTapped = output<VehicleCardInput>();

  private readonly _hovered = signal(false);
  readonly hovered = this._hovered.asReadonly();

  readonly hasDefaultVersion = computed(() =>
    Boolean(this.model().defaultVersion?.id),
  );

  readonly segmentLabel = computed(() => this.segmentToLabel(this.model().segment));
  readonly priceFormatted = computed(() => {
    const minPrice = this.model().minPrice;
    const value = this.model().defaultVersion?.priceClp ?? minPrice ?? null;
    if (value === null) return '';
    return new Intl.NumberFormat('es-CL').format(value);
  });

  readonly imageStyle = computed(() => {
    const url = this.model().imageUrl;
    return url
      ? { 'background-image': `url("${url}")` }
      : {};
  });

  readonly comparabilityLabel = computed(() => {
    const dv = this.model().defaultVersion;
    if (this.added()) return `Quitar ${this.model().name} ${dv?.name ?? ''} de la comparación`;
    return dv ? `Agregar ${this.model().name} ${dv.name} ${dv.year} a la comparación` : '';
  });

  onCompare(event: Event): void {
    event.stopPropagation();
    if (!this.hasDefaultVersion()) return;
    if (this.added() || this.maxReached()) {
      this.compareTapped.emit(this.model());
      return;
    }
    this.compareTapped.emit(this.model());
  }

  onMouseEnter(): void {
    this._hovered.set(true);
  }
  onMouseLeave(): void {
    this._hovered.set(false);
  }

  private segmentToLabel(s: string): string {
    const map: Record<string, string> = {
      SEDAN: 'Sedán',
      SUV: 'SUV',
      HATCHBACK: 'Hatchback',
      PICKUP: 'Pickup',
      CROSSOVER: 'Crossover',
      COMMERCIAL: 'Comercial',
    };
    return map[s] ?? s;
  }
}
