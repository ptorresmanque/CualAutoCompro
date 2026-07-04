import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ApiService, QueryParams } from '../../core/api.service';
import { CompareStore } from '../../core/compare-store.service';
import { FavoritesStore } from '../../core/favorites-store.service';
import {
  VehicleCardComponent,
  VehicleCardInput,
} from '../../shared/ui/vehicle-card.component';
import { RangeSliderComponent } from '../../shared/ui/range-slider.component';
import { VehicleVersion } from '../../core/types/vehicle';

type Segment =
  | 'SEDAN'
  | 'SUV'
  | 'HATCHBACK'
  | 'PICKUP'
  | 'CROSSOVER'
  | 'COMMERCIAL';

type Transmission = 'MANUAL' | 'AUTOMATIC' | 'CVT' | 'DCT';
type Fuel = 'BENCINA' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
type Sort = 'name' | 'minPrice' | 'minConsumption';
type Order = 'asc' | 'desc';

export interface CatalogFilters {
  q?: string;
  brand?: string;
  segment?: Segment;
  priceMin?: number;
  priceMax?: number;
  transmission?: Transmission;
  fuel?: Fuel;
  powerMin?: number;
  consumptionMax?: number;
  consumptionHighwayMax?: number;
  sort?: Sort;
  order?: Order;
}

const FEATURED_MODEL_NAMES = new Set(['Corolla', 'Tucson', 'CX-5']);

const PRICE_BOUNDS = { min: 0, max: 100_000_000, step: 500_000 };
const POWER_BOUNDS = { min: 0, max: 1000, step: 10 };
const CONSUMPTION_BOUNDS = { min: 0, max: 40, step: 0.5 };

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css',
  imports: [
    RouterLink,
    VehicleCardComponent,
    RangeSliderComponent,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatRadioModule,
    MatSelectModule,
  ],
})
export class CatalogComponent {
  private api = inject(ApiService);
  private compare = inject(CompareStore);
  private route = inject(ActivatedRoute);
  readonly favorites = inject(FavoritesStore);

  readonly segments: ReadonlyArray<{ value: Segment; label: string }> = [
    { value: 'SEDAN', label: 'Sedán' },
    { value: 'SUV', label: 'SUV' },
    { value: 'HATCHBACK', label: 'Hatchback' },
    { value: 'PICKUP', label: 'Pickup' },
    { value: 'CROSSOVER', label: 'Crossover' },
    { value: 'COMMERCIAL', label: 'Comercial' },
  ];

  readonly transmissions: ReadonlyArray<{ value: Transmission; label: string }> = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'AUTOMATIC', label: 'Automática' },
    { value: 'CVT', label: 'CVT' },
    { value: 'DCT', label: 'DCT' },
  ];

  readonly fuels: ReadonlyArray<{ value: Fuel; label: string }> = [
    { value: 'BENCINA', label: 'Bencina' },
    { value: 'DIESEL', label: 'Diésel' },
    { value: 'HYBRID', label: 'Híbrido' },
    { value: 'ELECTRIC', label: 'Eléctrico' },
  ];

  readonly sortOptions: ReadonlyArray<{ value: Sort; label: string; tip?: string }> = [
    { value: 'name', label: 'Nombre' },
    { value: 'minPrice', label: 'Precio' },
    { value: 'minConsumption', label: 'Rendimiento', tip: 'Rendimiento = menor consumo de combustible en ciudad (km/L).' },
  ];

  readonly priceBounds = PRICE_BOUNDS;
  readonly powerBounds = POWER_BOUNDS;
  readonly consumptionBounds = CONSUMPTION_BOUNDS;

  readonly brands = signal<Array<{ id: string; name: string }>>([]);

  filters = signal<CatalogFilters>({ sort: 'name', order: 'asc' });
  items = signal<VehicleCardInput[]>([]);
  total = signal(0);
  loading = signal(false);
  currentQuery = signal<string>('');

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

  readonly initialLoad: Promise<unknown>;

  constructor() {
    const q = this.route.snapshot.queryParamMap.get('q')?.trim() ?? '';
    this.currentQuery.set(q);
    if (q) this.filters.update((f) => ({ ...f, q }));
    this.initialLoad = Promise.all([this.loadBrands(), this.load()]);
  }

  private async loadBrands(): Promise<void> {
    try {
      const res = await this.api.get<{ data: Array<{ id: string; name: string }> }>('/brands');
      this.brands.set(res.data);
    } catch {
      /* ignore */
    }
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

  onFavoriteToggled(item: VehicleCardInput, v: VehicleVersion): void {
    void this.favorites.toggle({ modelId: item.id, versionId: v.id });
  }

  clearSelection(): void {
    this.compare.clear();
  }

  async clearFilters(): Promise<void> {
    this.filters.set({ sort: 'name', order: 'asc' });
    this.selectedVersions.set({});
    await this.load();
  }

  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('es-CL').format(value);
  }

  readonly priceFormatter = (v: number): string =>
    `$${new Intl.NumberFormat('es-CL').format(v)}`;
  readonly hpFormatter = (v: number): string => `${v} hp`;
  readonly kmLFormatter = (v: number): string => `${v} km/L`;

  onPriceMinChange(v: number): Promise<void> {
    return this.updateFilter({
      priceMin: v > this.priceBounds.min ? v : undefined,
    });
  }

  onPriceMaxChange(v: number): Promise<void> {
    return this.updateFilter({
      priceMax: v < this.priceBounds.max ? v : undefined,
    });
  }

  onPowerMinChange(v: number): Promise<void> {
    return this.updateFilter({
      powerMin: v > this.powerBounds.min ? v : undefined,
    });
  }

  onConsumptionMaxChange(v: number): Promise<void> {
    return this.updateFilter({
      consumptionMax: v < this.consumptionBounds.max ? v : undefined,
    });
  }

  onConsumptionHighwayMaxChange(v: number): Promise<void> {
    return this.updateFilter({
      consumptionHighwayMax: v < this.consumptionBounds.max ? v : undefined,
    });
  }

  sortTip(): string {
    const opt = this.sortOptions.find(
      (o) => o.value === (this.filters().sort ?? 'name'),
    );
    return opt?.tip ?? '';
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
