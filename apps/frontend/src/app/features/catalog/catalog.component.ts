import { Component, inject, signal } from '@angular/core';
import { ApiService, QueryParams } from '../../core/api.service';
import { CompareStore } from '../../core/compare-store.service';
import { DisclaimerComponent } from '../../shared/ui/disclaimer.component';

type Segment =
  | 'SEDAN'
  | 'SUV'
  | 'HATCHBACK'
  | 'PICKUP'
  | 'CROSSOVER'
  | 'COMMERCIAL';

export interface CatalogDefaultVersion {
  id: string;
  name: string;
  priceClp: number;
  year: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  segment: Segment;
  minPrice: number | null;
  maxPrice?: number | null;
  brand: { name: string };
  imageUrl?: string | null;
  defaultVersion?: CatalogDefaultVersion | null;
}

export interface CatalogFilters {
  brand?: string;
  segment?: Segment;
  priceMin?: number;
  priceMax?: number;
  transmission?: string;
  fuel?: string;
  powerMin?: number;
}

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css',
  imports: [DisclaimerComponent],
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
    this.compare.add(v.id);
  }

  canCompare(item: CatalogItem): boolean {
    return Boolean(item.defaultVersion?.id);
  }

  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('es-CL').format(value);
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
