import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
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
  page?: number;
  pageSize?: number;
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
    MatSidenavModule,
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

  filters = signal<CatalogFilters>({ sort: 'name', order: 'asc', page: 1, pageSize: 20 });
  items = signal<VehicleCardInput[]>([]);
  total = signal(0);
  loading = signal(false);
  loadError = signal<string | null>(null);

  readonly selectedVersions = signal<Record<string, string>>({});

  readonly selectedIds = this.compare.ids;
  readonly selectionCount = computed(() => this.selectedIds().length);
  readonly maxReached = computed(() => this.selectionCount() >= 3);

  readonly isHandset = signal(false);
  readonly sidenavMode = computed<'over' | 'side'>(() =>
    this.isHandset() ? 'over' : 'side',
  );
  readonly filtersOpen = signal(false);
  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / (this.filters().pageSize ?? 20))),
  );
  readonly hasPreviousPage = computed(() => (this.filters().page ?? 1) > 1);
  readonly hasNextPage = computed(() => (this.filters().page ?? 1) < this.pageCount());

  private router = inject(Router);
  private lastWrittenQueryKey: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(max-width: 767.98px)');
      this.isHandset.set(mq.matches);
      mq.addEventListener('change', (e) => {
        this.isHandset.set(e.matches);
        if (!e.matches) {
          this.filtersOpen.set(false);
        }
      });
    }
    this.filters.set(this.filtersFromParams(this.route.snapshot.queryParamMap));
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const next = this.filtersFromParams(params);
      const queryKey = this.queryKey(next);
      if (queryKey === this.lastWrittenQueryKey) {
        this.lastWrittenQueryKey = null;
        return;
      }
      if (JSON.stringify(next) === JSON.stringify(this.filters())) return;
      this.filters.set(next);
      void this.load();
    });
    this.initialLoad = Promise.all([this.loadBrands(), this.load()]);
  }

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
    this.loadError.set(null);
    try {
      const res = await this.api.get<{
        data: { items: VehicleCardInput[]; total: number };
      }>('/models', this.cleanParams(this.filters()));
      this.items.set(res.data.items);
      this.total.set(res.data.total);
    } catch {
      this.loadError.set('No se pudo cargar el catálogo. Intenta nuevamente.');
    } finally {
      this.loading.set(false);
    }
  }

  updateFilter(patch: Partial<CatalogFilters>): Promise<void> {
    const next = { ...this.filters(), ...patch, page: patch.page ?? 1 };
    this.filters.set(next);
    this.lastWrittenQueryKey = this.queryKey(next);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.cleanParams(next),
      replaceUrl: true,
    });
    return this.load();
  }

  goToPage(page: number): Promise<void> {
    const target = Math.min(Math.max(1, page), this.pageCount());
    if (target === (this.filters().page ?? 1)) return Promise.resolve();
    return this.updateFilter({ page: target });
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
    this.filters.set({ sort: 'name', order: 'asc', page: 1, pageSize: 20 });
    this.selectedVersions.set({});
    this.lastWrittenQueryKey = this.queryKey(this.filters());
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    await this.load();
    if (this.isHandset()) {
      this.filtersOpen.set(false);
    }
  }

  toggleFilters(): void {
    this.filtersOpen.update((v) => !v);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
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

  private filtersFromParams(params: import('@angular/router').ParamMap): CatalogFilters {
    const numberParam = (key: string): number | undefined => {
      const value = params.get(key);
      if (value === null || value === '') return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    const sort = params.get('sort');
    const order = params.get('order');
    const next: CatalogFilters = {
      sort: sort === 'minPrice' || sort === 'minConsumption' ? sort : 'name',
      order: order === 'desc' ? 'desc' : 'asc',
      page: Math.max(1, Math.trunc(numberParam('page') ?? 1)),
      pageSize: Math.min(50, Math.max(1, Math.trunc(numberParam('pageSize') ?? 20))),
    };
    const text = params.get('q')?.trim();
    if (text) next.q = text;
    const brand = params.get('brand');
    if (brand) next.brand = brand;
    const segment = params.get('segment');
    if (segment) next.segment = segment as Segment;
    const transmission = params.get('transmission');
    if (transmission) next.transmission = transmission as Transmission;
    const fuel = params.get('fuel');
    if (fuel) next.fuel = fuel as Fuel;
    for (const key of ['priceMin', 'priceMax', 'powerMin', 'consumptionMax', 'consumptionHighwayMax'] as const) {
      const value = numberParam(key);
      if (value !== undefined) next[key] = value;
    }
    return next;
  }

  private queryKey(filters: CatalogFilters): string {
    return Object.entries(this.cleanParams(filters))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }
}
