import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, QueryParams } from '../../core/api.service';
import { CompareStore } from '../../core/compare-store.service';
import { DisclaimerComponent } from '../../shared/ui/disclaimer.component';
import { VehicleCardComponent, VehicleCardInput } from '../../shared/ui/vehicle-card.component';

type Segment =
  | 'SEDAN'
  | 'SUV'
  | 'HATCHBACK'
  | 'PICKUP'
  | 'CROSSOVER'
  | 'COMMERCIAL';

export type CatalogItem = VehicleCardInput & { segment: Segment };

export interface CatalogFilters {
  brand?: string;
  segment?: Segment;
  priceMin?: number;
  priceMax?: number;
  transmission?: string;
  fuel?: string;
  powerMin?: number;
}

/** Nombres de modelos marcados como "Más Vendido" en el diseño Stitch. */
const FEATURED_MODEL_NAMES = new Set(['Corolla', 'Tucson', 'CX-5']);

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css',
  imports: [RouterLink, DisclaimerComponent, VehicleCardComponent],
})
export class CatalogComponent {
  private api = inject(ApiService);
  private compare = inject(CompareStore);

  readonly segments: ReadonlyArray<{
    value: Segment;
    label: string;
  }> = [
    { value: 'SEDAN', label: 'Sedán' },
    { value: 'SUV', label: 'SUV' },
    { value: 'HATCHBACK', label: 'Hatchback' },
    { value: 'PICKUP', label: 'Pickup' },
    { value: 'CROSSOVER', label: 'Crossover' },
    { value: 'COMMERCIAL', label: 'Comercial' },
  ];

  filters = signal<CatalogFilters>({});
  items = signal<CatalogItem[]>([]);
  total = signal(0);
  loading = signal(false);

  readonly selectedIds = this.compare.ids;
  readonly selectionCount = computed(() => this.selectedIds().length);
  readonly maxReached = computed(() => this.selectionCount() >= 3);

  isAdded(item: CatalogItem): boolean {
    const id = item.defaultVersion?.id;
    return id ? this.selectedIds().includes(id) : false;
  }

  readonly initialLoad: Promise<void>;

  constructor() {
    this.initialLoad = this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.get<{
        data: { items: CatalogItem[]; total: number };
      }>('/models', this.cleanParams(this.filters()));
      this.items.set(res.data.items);
      this.total.set(res.data.total);
    } finally {
      this.loading.set(false);
    }
  }

  updateFilter(patch: Partial<CatalogFilters>): Promise<void> {
    this.filters.update((f) => ({ ...f, ...patch }));
    return this.load();
  }

  addToCompare(item: CatalogItem): void {
    const v = item.defaultVersion;
    if (!v) return;
    if (this.selectedIds().includes(v.id)) {
      this.compare.remove(v.id);
    } else {
      this.compare.add(v.id);
    }
  }

  clearSelection(): void {
    this.compare.clear();
  }

  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('es-CL').format(value);
  }

  isFeatured(name: string): boolean {
    return FEATURED_MODEL_NAMES.has(name);
  }

  async clearFilters(): Promise<void> {
    this.filters.set({});
    await this.load();
  }

  private cleanParams(f: CatalogFilters): QueryParams {
    const out: QueryParams = {};
    for (const [k, v] of Object.entries(f)) {
      if (v !== undefined && v !== null && v !== '') {
        out[k] = v as QueryParams[string];
      }
    }
    return out;
  }
}
