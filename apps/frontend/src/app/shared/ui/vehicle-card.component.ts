import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VehicleVersion } from '../../core/types/vehicle';

export interface VehicleCardInput {
  id: string;
  name: string;
  segment: string;
  brand: { name: string };
  imageUrl?: string | null;
  minPrice: number | null;
  defaultVersion?: VehicleVersion | null;
  versions: VehicleVersion[];
}

@Component({
  selector: 'app-vehicle-card',
  imports: [NgStyle, RouterLink],
  templateUrl: './vehicle-card.component.html',
  styleUrl: './vehicle-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleCardComponent {
  readonly model = input.required<VehicleCardInput>();
  readonly featured = input<boolean>(false);
  readonly added = input<boolean>(false);
  readonly maxReached = input<boolean>(false);
  readonly selectedVersionId = input<string | null>(null);
  readonly compareTapped = output<VehicleVersion>();
  readonly versionSelected = output<VehicleVersion>();

  private readonly _hovered = signal(false);
  readonly hovered = this._hovered.asReadonly();

  readonly hasDefaultVersion = computed(() =>
    Boolean(this.model().defaultVersion?.id),
  );

  readonly hasMultipleVersions = computed(() => this.model().versions.length > 1);

  readonly selectedVersion = computed<VehicleVersion | null>(() => {
    const id = this.selectedVersionId();
    if (id) {
      const found = this.model().versions.find((v) => v.id === id);
      if (found) return found;
    }
    return this.model().versions[0] ?? null;
  });

  readonly segmentLabel = computed(() => this.segmentToLabel(this.model().segment));
  readonly priceFormatted = computed(() => {
    const v = this.selectedVersion();
    if (v) return new Intl.NumberFormat('es-CL').format(v.priceClp);
    const minPrice = this.model().minPrice;
    return minPrice != null ? new Intl.NumberFormat('es-CL').format(minPrice) : '';
  });

  readonly imageStyle = computed(() => {
    const url = this.model().imageUrl;
    return url ? { 'background-image': `url("${url}")` } : {};
  });

  readonly comparabilityLabel = computed(() => {
    const v = this.selectedVersion();
    if (this.added()) {
      return `Quitar ${this.model().name} ${v?.name ?? ''} de la comparación`;
    }
    return v
      ? `Agregar ${this.model().name} ${v.name} ${v.year} a la comparación`
      : '';
  });

  readonly detailUrl = computed(() => {
    const m = this.model();
    const brandSlug = m.brand.name.toLowerCase();
    const modelSlug = m.name.toLowerCase();
    return ['/brand', brandSlug, 'model', modelSlug];
  });

  onCompare(event: Event): void {
    event.stopPropagation();
    if (!this.hasDefaultVersion()) return;
    this.compareTapped.emit(this.selectedVersion() ?? this.model().defaultVersion!);
  }

  onSelectVersion(event: Event, v: VehicleVersion): void {
    event.stopPropagation();
    this.versionSelected.emit(v);
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
