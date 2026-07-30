import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ApiService, QueryParams } from '../../core/api.service';
import { CompareStore } from '../../core/compare-store.service';
import { PopularityService } from '../../core/popularity.service';
import { FavoritesStore } from '../../core/favorites-store.service';
import {
  VehicleCardComponent,
  VehicleCardInput,
} from '../../shared/ui/vehicle-card.component';
import { RangeSliderComponent } from '../../shared/ui/range-slider.component';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { VehicleVersion } from '../../core/types/vehicle';
import {
  CANONICAL_FUELS,
  CANONICAL_SEGMENTS,
  CANONICAL_TRANSMISSIONS,
  fuelLabel,
  segmentLabel,
  transmissionLabel,
} from '../../core/types/catalog-labels';

// Segmento, transmisión y combustible son tokens abiertos, no uniones
// cerradas: el admin puede dar de alta valores nuevos con la opción "Otro" y
// las opciones reales llegan desde la API (ver `loadFacets`).
// `efficiency` ordena por el mejor rendimiento del modelo (mayor km/L).
// `minConsumption` sigue existiendo en la API pero ordena por el PEOR, que es
// lo contrario de lo que espera quien elige "Rendimiento" en la UI.
type Sort = 'name' | 'minPrice' | 'efficiency';
type Order = 'asc' | 'desc';

export interface FilterOption {
  value: string;
  label: string;
}

/** Filtro activo, para los chips que se muestran sobre la grilla. */
export interface ActiveFilterChip {
  key: keyof CatalogFilters;
  /** Presente solo en filtros multi-valor: el valor puntual que quita el chip. */
  value?: string;
  label: string;
  /** Texto del `aria-label` del botón de quitar. */
  removeLabel: string;
  /** Identidad estable para el `track` del `@for`. */
  id: string;
}

export interface CatalogFilters {
  q?: string;
  brand?: string;
  /**
   * Multi-selección: varios segmentos son una unión ("SUV o Crossover"). Viaja
   * a la API como CSV (`segment=SUV,CROSSOVER`); vacío o ausente = cualquiera.
   */
  segment?: string[];
  priceMin?: number;
  priceMax?: number;
  transmission?: string[];
  fuel?: string[];
  powerMin?: number;
  /** Rendimiento mínimo en km/L (ciudad). Más km/L = gasta menos. */
  consumptionMinKmL?: number;
  /** Rendimiento mínimo en km/L (carretera). */
  consumptionHighwayMinKmL?: number;
  sort?: Sort;
  order?: Order;
  page?: number;
  pageSize?: number;
}

function toOptions(
  tokens: readonly string[],
  label: (token: string) => string,
): FilterOption[] {
  return tokens.map((value) => ({ value, label: label(value) }));
}

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
    SearchInputComponent,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSidenavModule,
  ],
})
export class CatalogComponent {
  private api = inject(ApiService);
  private compare = inject(CompareStore);
  readonly popularity = inject(PopularityService);
  private route = inject(ActivatedRoute);
  readonly favorites = inject(FavoritesStore);

  // Se llenan desde la API (`loadFacets`). Los valores iniciales son los
  // canónicos para que los filtros no aparezcan vacíos mientras carga.
  readonly segments = signal<FilterOption[]>(toOptions(CANONICAL_SEGMENTS, segmentLabel));
  readonly transmissions = signal<FilterOption[]>(toOptions(CANONICAL_TRANSMISSIONS, transmissionLabel));
  readonly fuels = signal<FilterOption[]>(toOptions(CANONICAL_FUELS, fuelLabel));

  readonly sortOptions: ReadonlyArray<{
    value: Sort;
    label: string;
    tip?: string;
    /** Dirección natural del criterio: en rendimiento, más es mejor. */
    defaultOrder: Order;
  }> = [
    { value: 'name', label: 'Nombre', defaultOrder: 'asc' },
    { value: 'minPrice', label: 'Precio', defaultOrder: 'asc' },
    {
      value: 'efficiency',
      label: 'Rendimiento',
      tip: 'Rendimiento = kilómetros por litro en ciudad. Más km/L es mejor.',
      defaultOrder: 'desc',
    },
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

  /**
   * Filtros activos como chips removibles. Existe porque con el drawer cerrado
   * en móvil no había ninguna señal de qué estaba filtrado: la grilla mostraba
   * 3 resultados y no se veía por qué.
   */
  readonly activeFilters = computed<ActiveFilterChip[]>(() => {
    const f = this.filters();
    const chips: ActiveFilterChip[] = [];
    const push = (key: keyof CatalogFilters, label: string, what: string) =>
      chips.push({ key, label, removeLabel: `Quitar filtro ${what}`, id: key });
    /** Un chip por valor: con dos segmentos marcados salen dos chips. */
    const pushEach = (
      key: 'segment' | 'transmission' | 'fuel',
      values: string[] | undefined,
      label: (v: string) => string,
      what: string,
    ) => {
      for (const value of values ?? []) {
        chips.push({
          key,
          value,
          label: label(value),
          removeLabel: `Quitar filtro de ${what} ${label(value)}`,
          id: `${key}:${value}`,
        });
      }
    };

    if (f.q) push('q', `“${f.q}”`, `de búsqueda “${f.q}”`);
    if (f.brand) {
      const name = this.brands().find((b) => b.id === f.brand)?.name;
      push('brand', name ?? 'Marca', `de marca ${name ?? ''}`.trim());
    }
    pushEach('segment', f.segment, segmentLabel, 'segmento');
    pushEach('transmission', f.transmission, transmissionLabel, 'transmisión');
    pushEach('fuel', f.fuel, fuelLabel, 'combustible');
    if (f.priceMin !== undefined) {
      push('priceMin', `Desde ${this.priceFormatter(f.priceMin)}`, 'de precio mínimo');
    }
    if (f.priceMax !== undefined) {
      push('priceMax', `Hasta ${this.priceFormatter(f.priceMax)}`, 'de precio máximo');
    }
    if (f.powerMin !== undefined) {
      push('powerMin', `Desde ${this.hpFormatter(f.powerMin)}`, 'de potencia mínima');
    }
    if (f.consumptionMinKmL !== undefined) {
      push(
        'consumptionMinKmL',
        `Ciudad ${this.kmLFormatter(f.consumptionMinKmL)}+`,
        'de rendimiento en ciudad',
      );
    }
    if (f.consumptionHighwayMinKmL !== undefined) {
      push(
        'consumptionHighwayMinKmL',
        `Carretera ${this.kmLFormatter(f.consumptionHighwayMinKmL)}+`,
        'de rendimiento en carretera',
      );
    }
    return chips;
  });

  readonly hasActiveFilters = computed(() => this.activeFilters().length > 0);

  readonly selectedIds = this.compare.ids;
  readonly selectionCount = computed(() => this.selectedIds().length);
  readonly maxReached = computed(() => this.selectionCount() >= 3);

  /**
   * Texto visible en el campo de búsqueda. Se separa de `filters().q` para que
   * el input responda a cada tecla mientras el request va debounceado: sin
   * debounce, cada letra dispararía un `router.navigate` + un GET `/models`.
   */
  readonly searchTerm = signal('');
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  /** Espera antes de buscar. Los tests lo bajan a 0 para no depender de timers. */
  searchDebounceMs = 350;

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
    this.searchTerm.set(this.filters().q ?? '');
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const next = this.filtersFromParams(params);
      const queryKey = this.queryKey(next);
      if (queryKey === this.lastWrittenQueryKey) {
        this.lastWrittenQueryKey = null;
        return;
      }
      if (JSON.stringify(next) === JSON.stringify(this.filters())) return;
      this.filters.set(next);
      // El término puede venir de afuera (buscador de la navbar, link
      // compartido, botón atrás), así que el campo se sincroniza con la URL.
      this.searchTerm.set(next.q ?? '');
      void this.load();
    });
    this.initialLoad = Promise.all([this.loadBrands(), this.loadFacets(), this.load()]);
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

readonly initialLoad: Promise<unknown>;

  private async loadBrands(): Promise<void> {
    try {
      const res = await this.api.get<{ data: Array<{ id: string; name: string }> }>('/brands');
      this.brands.set(res.data);
    } catch {
      /* ignore */
    }
  }

  /**
   * Opciones de segmento / transmisión / combustible según lo que existe en la
   * DB, incluidos los valores creados desde la opción "Otro" del admin. Si
   * falla, quedan los canónicos con los que se inicializan las señales.
   */
  private async loadFacets(): Promise<void> {
    const facets: Array<[string, typeof this.segments, (t: string) => string]> = [
      ['/models/segments', this.segments, segmentLabel],
      ['/versions/transmissions', this.transmissions, transmissionLabel],
      ['/versions/fuels', this.fuels, fuelLabel],
    ];
    await Promise.all(
      facets.map(async ([path, target, label]) => {
        try {
          const res = await this.api.get<{ data: Array<{ id: string }> }>(path);
          const options = toOptions(res.data.map((o) => o.id), label);
          if (options.length > 0) target.set(options);
        } catch {
          /* se conservan los canónicos */
        }
      }),
    );
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
      this.popularity.recordAdd(versionId);
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

  /**
   * Cada tecla actualiza el campo; el request espera `searchDebounceMs` sin
   * tipeo. Devuelve la promesa del filtro aplicado (o `null` si todavía está
   * esperando) para que los tests puedan await-earla.
   */
  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (this.searchDebounce !== null) clearTimeout(this.searchDebounce);
    const apply = (): void => {
      this.searchDebounce = null;
      const term = value.trim();
      if ((this.filters().q ?? '') === term) return;
      void this.updateFilter({ q: term || undefined });
    };
    if (this.searchDebounceMs <= 0) {
      apply();
      return;
    }
    this.searchDebounce = setTimeout(apply, this.searchDebounceMs);
  }

  /**
   * Quita un filtro desde su chip. En los multi-valor saca solo ese valor y
   * deja los demás: quitar "SUV" no debería borrar también "Crossover".
   */
  removeFilter(key: keyof CatalogFilters, value?: string): Promise<void> {
    if (key === 'q') {
      if (this.searchDebounce !== null) {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = null;
      }
      this.searchTerm.set('');
    }
    if (value !== undefined) {
      return this.toggleMulti(key as 'segment' | 'transmission' | 'fuel', value);
    }
    return this.updateFilter({ [key]: undefined } as Partial<CatalogFilters>);
  }

  async clearFilters(): Promise<void> {
    if (this.searchDebounce !== null) {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = null;
    }
    this.searchTerm.set('');
    this.filters.set({ sort: 'name', order: 'asc', page: 1, pageSize: 20 });
    this.selectedVersions.set({});
    this.lastWrittenQueryKey = this.queryKey(this.filters());
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    await this.load();
    if (this.isHandset()) {
      this.filtersOpen.set(false);
    }
  }

  /** Claves de filtro que aceptan varios valores a la vez. */
  private static readonly MULTI_KEYS = [
    'segment',
    'transmission',
    'fuel',
  ] as const satisfies ReadonlyArray<keyof CatalogFilters>;

  isMultiSelected(key: 'segment' | 'transmission' | 'fuel', value: string): boolean {
    return (this.filters()[key] ?? []).includes(value);
  }

  /**
   * Marca / desmarca un valor de un filtro multi-selección. Sin ninguno marcado
   * el filtro desaparece de la URL, que es la forma de decir "cualquiera".
   */
  toggleMulti(
    key: 'segment' | 'transmission' | 'fuel',
    value: string,
  ): Promise<void> {
    const current = this.filters()[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    return this.updateFilter({
      [key]: next.length > 0 ? next : undefined,
    } as Partial<CatalogFilters>);
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

  /**
   * Rendimiento **mínimo**: el slider arranca en el bound bajo (sin filtro) y
   * subirlo exige más km/L. Antes esto mandaba `consumptionMax` (lte), así que
   * mover el slider descartaba justo los autos más eficientes.
   */
  onConsumptionMinChange(v: number): Promise<void> {
    return this.updateFilter({
      consumptionMinKmL: v > this.consumptionBounds.min ? v : undefined,
    });
  }

  onConsumptionHighwayMinChange(v: number): Promise<void> {
    return this.updateFilter({
      consumptionHighwayMinKmL: v > this.consumptionBounds.min ? v : undefined,
    });
  }

  /**
   * Cambiar de criterio resetea la dirección a la natural del criterio: elegir
   * "Rendimiento" tiene que mostrar primero el más eficiente, no el que más
   * gasta.
   */
  onSortChange(sort: Sort): Promise<void> {
    const opt = this.sortOptions.find((o) => o.value === sort);
    return this.updateFilter({ sort, order: opt?.defaultOrder ?? 'asc' });
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
      // Los filtros multi-valor viajan como CSV (`segment=SUV,CROSSOVER`); un
      // array vacío equivale a "sin filtro" y se omite.
      if (Array.isArray(v)) {
        if (v.length > 0) out[k] = v.join(',');
        continue;
      }
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
    const parsedSort: Sort =
      sort === 'minPrice' || sort === 'efficiency' ? sort : 'name';
    const next: CatalogFilters = {
      sort: parsedSort,
      // Sin `order` explícito manda la dirección natural del criterio, para que
      // un link a `?sort=efficiency` muestre el más eficiente primero.
      order:
        order === 'desc' || order === 'asc'
          ? order
          : (this.sortOptions.find((o) => o.value === parsedSort)?.defaultOrder ??
            'asc'),
      page: Math.max(1, Math.trunc(numberParam('page') ?? 1)),
      pageSize: Math.min(50, Math.max(1, Math.trunc(numberParam('pageSize') ?? 20))),
    };
    const text = params.get('q')?.trim();
    if (text) next.q = text;
    const brand = params.get('brand');
    if (brand) next.brand = brand;
    // CSV → array. Un solo valor (`segment=SUV`, la forma histórica del link)
    // entra igual, así que las URLs viejas siguen funcionando.
    for (const key of CatalogComponent.MULTI_KEYS) {
      const raw = params.get(key);
      if (!raw) continue;
      const values = raw
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      if (values.length > 0) next[key] = values;
    }
    for (const key of [
      'priceMin',
      'priceMax',
      'powerMin',
      'consumptionMinKmL',
      'consumptionHighwayMinKmL',
    ] as const) {
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
