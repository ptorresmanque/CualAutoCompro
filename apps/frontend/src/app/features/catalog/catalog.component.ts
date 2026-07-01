import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, QueryParams } from '../../core/api.service';
import { CompareStore } from '../../core/compare-store.service';
import {
  VehicleCardComponent,
  VehicleCardInput,
} from '../../shared/ui/vehicle-card.component';
import { VehicleVersion } from '../../core/types/vehicle';

type Segment =
  | 'SEDAN'
  | 'SUV'
  | 'HATCHBACK'
  | 'PICKUP'
  | 'CROSSOVER'
  | 'COMMERCIAL';

export interface CatalogFilters {
  brand?: string;
  segment?: Segment;
  priceMin?: number;
  priceMax?: number;
  transmission?: string;
  fuel?: string;
  powerMin?: number;
}

const FEATURED_MODEL_NAMES = new Set(['Corolla', 'Tucson', 'CX-5']);

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css',
  imports: [RouterLink, VehicleCardComponent],
})
export class CatalogComponent {
  private api = inject(ApiService);
  private compare = inject(CompareStore);

  readonly segments: ReadonlyArray<{ value: Segment; label: string }> = [
    { value: 'SEDAN', label: 'Sedán' },
    { value: 'SUV', label: 'SUV' },
    { value: 'HATCHBACK', label: 'Hatchback' },
    { value: 'PICKUP', label: 'Pickup' },
    { value: 'CROSSOVER', label: 'Crossover' },
    { value: 'COMMERCIAL', label: 'Comercial' },
  ];

  filters = signal<CatalogFilters>({});
  items = signal<VehicleCardInput[]>([]);
  total = signal(0);
  loading = signal(false);

  /** modelId -> versionId */
  readonly selectedVersions = signal<Record<string, string>>({});

  readonly selectedIds = this.compare.ids;
  readonly selectionCount = computed(() => this.selectedIds().length);
  readonly maxReached = computed(() => this.selectionCount() >= 3);

  isAdded(item: VehicleCardInput): boolean {
    const id = this.selectedVersionId(item);
    return id ? this.selectedIds().includes(id) : false;
  }

  selectedVersionId(item: VehicleCardInput): string | null {
    const override = this.selectedVersions()[item.id];
    if (override) return override;
    return item.versions[0]?.id ?? item.defaultVersion?.id ?? null;
  }

  isFeatured(name: string): boolean {
    return FEATURED_MODEL_NAMES.has(name);
  }

  readonly initialLoad: Promise<void>;

  constructor() {
    this.initialLoad = this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.get<{
        data: { items: VehicleCardInput[]; total: number };
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

  addToCompare(item: VehicleCardInput): void {
    const versionId = this.selectedVersionId(item);
    if (!versionId) return;
    if (this.selectedIds().includes(versionId)) {
      this.compare.remove(versionId);
    } else {
      this.compare.add(versionId);
    }
  }

  onVersionSelected(item: VehicleCardInput, v: VehicleVersion): void {
    this.selectedVersions.update((m) => ({ ...m, [item.id]: v.id }));
  }

  clearSelection(): void {
    this.compare.clear();
  }

  async clearFilters(): Promise<void> {
    this.filters.set({});
    await this.load();
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
