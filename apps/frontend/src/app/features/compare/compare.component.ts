import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import {
  AnnualCostService,
  clampKmPerYear,
  DEFAULT_KM_PER_YEAR,
  MAX_KM_PER_YEAR,
  type CostBreakdown,
} from '../../core/annual-cost.service';
import { AuthService } from '../../core/auth.service';
import { CompareStore } from '../../core/compare-store.service';
import { toAbsoluteUploadUrl } from '../../core/upload-url';
import { slugify } from '../../core/slug';
import {
  COMPARE_DEFAULT_META,
  PageMetaService,
} from '../../core/page-meta.service';
import { VehicleCardInput } from '../../shared/ui/vehicle-card.component';
import { versionFieldLabel } from '../../core/types/version-labels';
import { fuelLabel, segmentLabel, transmissionLabel } from '../../core/types/catalog-labels';

interface ModelLite {
  name: string;
  brand: { name: string };
}

interface AvailableVersionLite {
  id: string;
  name: string;
  year: number;
  priceClp: number;
  transmission?: string | null;
  fuel?: string | null;
  traction?: string | null;
  engineType?: string | null;
}

export interface CompareVersion {
  id: string;
  name: string;
  priceClp?: number | null;
  year?: number | null;
  transmission?: string | null;
  fuel?: string | null;
  traction?: string | null;
  engineType?: string | null;
  engineDisplacementCc?: number | null;
  powerHp?: number | null;
  torqueNm?: number | null;
  consumptionCityKmL?: number | null;
  consumptionHighwayKmL?: number | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  weightKg?: number | null;
  trunkLiters?: number | null;
  circulationPermitClp?: number | null;
  equipmentItems?: { equipmentItem: { id: string; name: string; category: string } }[];
  mandatoryInsuranceClp?: number | null;
  voluntaryInsuranceClp?: number | null;
  fuelTankLiters?: number | null;
  batteryCapacityKwh?: number | null;
  hasRecall?: boolean | null;
  recallUrl?: string | null;
  computedFillCostClp?: number | null;
  maintenanceCosts?: { mileageTag: number; costClp: number }[];
  model?: ModelLite & { id?: string; availableVersions?: AvailableVersionLite[] };
}

type DiffKey =
  | 'priceClp'
  | 'year'
  | 'transmission'
  | 'fuel'
  | 'traction'
  | 'engineType'
  | 'engineDisplacementCc'
  | 'powerHp'
  | 'torqueNm'
  | 'consumptionCityKmL'
  | 'consumptionHighwayKmL'
  | 'lengthMm'
  | 'widthMm'
  | 'heightMm'
  | 'weightKg'
  | 'trunkLiters'
  | 'circulationPermitClp'
  | 'mandatoryInsuranceClp'
  | 'voluntaryInsuranceClp'
  | 'computedFillCostClp';

/**
 * Dirección en la que un atributo es "mejor". Sin esto la tabla muestra datos
 * pero no ayuda a decidir: el usuario tiene que comparar números a ojo y saber
 * de memoria si en km/L conviene más o menos.
 *
 * `undefined` = no hay mejor ni peor (transmisión, combustible, año…).
 */
type Better = 'lower' | 'higher';

type CompareRow =
  | {
      kind: 'simple';
      key: DiffKey;
      label: string;
      format: (v: CompareVersion) => string;
      better?: Better;
      /** Valor numérico para comparar. Solo hace falta si hay `better`. */
      numeric?: (v: CompareVersion) => number | null | undefined;
    }
  | { kind: 'maintenanceBreakdown'; label: string }
  | { kind: 'equipmentList'; label: string; category: string };

interface Section {
  name: string;
  label: string;
  rows: CompareRow[];
}

interface CompareResponse {
  versions: CompareVersion[];
  diffHighlights: Partial<Record<DiffKey, boolean>>;
}

interface ComparisonItem {
  versionId: string;
  position: number;
  version: CompareVersion;
}

interface ComparisonBySlugResponse {
  id: string;
  slug: string;
  userId: string;
  createdAt: string;
  items: ComparisonItem[];
}

@Component({
  selector: 'app-compare',
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.css',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    DecimalPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareComponent {
  private api = inject(ApiService);
  private annualCost = inject(AnnualCostService);
  private auth = inject(AuthService);
  private compareStore = inject(CompareStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private pageMeta = inject(PageMetaService);

  readonly user = this.auth.currentUser;

  versions = signal<CompareVersion[]>([]);
  diffHighlights = signal<Partial<Record<DiffKey, boolean>>>({});
  loading = signal(false);
  saving = signal(false);
  saveName = signal('');
  savedSlug = signal<string | null>(null);
  duplicateSlug = signal<string | null>(null);
  sharedMeta = signal<{ slug: string; createdAt: string; userId: string } | null>(null);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  swappingFor = signal<string | null>(null); // versionId of card with open popover
  maintPopoverFor = signal<string | null>(null);
  favoriteModels = signal<VehicleCardInput[]>([]);

  readonly count = computed(() => this.versions().length);

  // El texto decía "ámbar", el landing y el encabezado decían "engine-red" y el
  // CSS pintaba azul pálido: tres descripciones y ninguna era el color real.
  readonly disclaimerText =
    'Las filas resaltadas son las que difieren entre las versiones comparadas.';

  readonly empty = computed(() => {
    this.versions();
    return (
      this.compareStore.ids().length === 0 &&
      this.versions().length === 0 &&
      this.sharedMeta() === null &&
      this.loadError() === null &&
      this.favoriteModels().length === 0
    );
  });

  readonly ready: Promise<void>;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (this.swappingFor() !== null && !target.closest('[data-testid^="swap-popover-"]') && !target.closest('[data-testid^="swap-button-"]')) {
      this.closeSwap();
    }
    if (this.maintPopoverFor() !== null && !target.closest('[data-testid^="maint-popover-panel-"]') && !target.closest('[data-testid^="maint-popover-btn-"]')) {
      this.closeMaintPopover();
    }
  }

  // Secciones estáticas. La sección "Equipamiento" se inyecta dinámicamente
  // por el computed `sections` para tener una fila por categoría.
  private readonly staticSections: ReadonlyArray<Section> = [
    {
      name: 'specs',
      label: 'Especificaciones',
      rows: [
        {
          kind: 'simple',
          key: 'engineDisplacementCc',
          label: 'Cilindrada',
          format: (v) => (v.engineDisplacementCc ? `${v.engineDisplacementCc} cc` : '—'),
        },
        {
          kind: 'simple',
          key: 'powerHp',
          label: 'Potencia',
          format: (v) => (v.powerHp ? `${v.powerHp} hp` : '—'),
          better: 'higher',
          numeric: (v) => v.powerHp,
        },
        {
          kind: 'simple',
          key: 'torqueNm',
          label: 'Torque',
          format: (v) => (v.torqueNm ? `${v.torqueNm} Nm` : '—'),
          better: 'higher',
          numeric: (v) => v.torqueNm,
        },
        {
          kind: 'simple',
          key: 'consumptionCityKmL',
          // km/L: más es mejor (rinde más con el mismo litro).
          label: 'Rendimiento ciudad',
          format: (v) => (v.consumptionCityKmL ? `${v.consumptionCityKmL} km/L` : '—'),
          better: 'higher',
          numeric: (v) => v.consumptionCityKmL,
        },
        {
          kind: 'simple',
          key: 'consumptionHighwayKmL',
          label: 'Rendimiento carretera',
          format: (v) => (v.consumptionHighwayKmL ? `${v.consumptionHighwayKmL} km/L` : '—'),
          better: 'higher',
          numeric: (v) => v.consumptionHighwayKmL,
        },
        {
          kind: 'simple',
          key: 'transmission',
          label: 'Transmisión',
          format: (v) => transmissionLabel(v.transmission) || '—',
        },
        {
          kind: 'simple',
          key: 'fuel',
          label: 'Combustible',
          format: (v) => fuelLabel(v.fuel) || '—',
        },
        { kind: 'simple', key: 'traction', label: 'Tracción', format: (v) => versionFieldLabel(v.traction) },
        { kind: 'simple', key: 'engineType', label: 'Tipo motor', format: (v) => v.fuel === 'ELECTRIC' ? '—' : versionFieldLabel(v.engineType) },
        {
          kind: 'simple',
          key: 'lengthMm',
          label: 'Largo',
          format: (v) => (v.lengthMm ? `${v.lengthMm} mm` : '—'),
        },
        {
          kind: 'simple',
          key: 'widthMm',
          label: 'Ancho',
          format: (v) => (v.widthMm ? `${v.widthMm} mm` : '—'),
        },
        {
          kind: 'simple',
          key: 'heightMm',
          label: 'Alto',
          format: (v) => (v.heightMm ? `${v.heightMm} mm` : '—'),
        },
        {
          kind: 'simple',
          key: 'weightKg',
          label: 'Peso',
          format: (v) => (v.weightKg ? `${v.weightKg} kg` : '—'),
        },
        {
          kind: 'simple',
          key: 'trunkLiters',
          label: 'Maletero',
          format: (v) => (v.trunkLiters ? `${v.trunkLiters} L` : '—'),
          better: 'higher',
          numeric: (v) => v.trunkLiters,
        },
      ],
    },
    {
      name: 'precio-anio',
      label: 'Precio y Año',
      rows: [
        {
          kind: 'simple',
          key: 'priceClp',
          label: 'Precio (CLP)',
          format: (v) => (v.priceClp ? this.formatPrice(v.priceClp) : '—'),
          better: 'lower',
          numeric: (v) => v.priceClp,
        },
        {
          kind: 'simple',
          key: 'year',
          label: 'Año',
          format: (v) => (v.year ? String(v.year) : '—'),
        },
      ],
    },
    // La seccion "Equipamiento" se genera dinamicamente en `this.equipmentSection`
    // (computed signal) con una fila por cada categoria presente en alguna version.
    // No se incluye aqui como seccion estatica para evitar duplicarla.
    {
      name: 'costos',
      label: 'Costos',
      rows: [
        { kind: 'maintenanceBreakdown', label: 'Mantención (CLP/por km)' },
        {
          kind: 'simple',
          key: 'circulationPermitClp',
          label: 'Permiso de circulación',
          format: (v) => (v.circulationPermitClp ? this.formatPrice(v.circulationPermitClp) : '—'),
          better: 'lower',
          numeric: (v) => v.circulationPermitClp,
        },
        {
          kind: 'simple',
          key: 'mandatoryInsuranceClp',
          label: 'Seguro obligatorio (SOAP)',
          format: (v) => (v.mandatoryInsuranceClp ? this.formatPrice(v.mandatoryInsuranceClp) : '—'),
          better: 'lower',
          numeric: (v) => v.mandatoryInsuranceClp,
        },
        {
          kind: 'simple',
          key: 'voluntaryInsuranceClp',
          label: 'Seguro automotriz',
          format: (v) => (v.voluntaryInsuranceClp ? this.formatPrice(v.voluntaryInsuranceClp) : '—'),
          better: 'lower',
          numeric: (v) => v.voluntaryInsuranceClp,
        },
        {
          kind: 'simple',
          key: 'computedFillCostClp',
          label: 'Llenar estanque',
          format: (v) => (v.computedFillCostClp ? this.formatPrice(v.computedFillCostClp) : '—'),
          better: 'lower',
          numeric: (v) => v.computedFillCostClp,
        },
      ],
    },
  ];

  /**
   * Sección dinámica de Equipamiento: una fila por cada categoría presente en
   * los `equipmentItems` de las versiones comparadas. Las categorías se ordenan
   * alfabéticamente y la sección solo aparece si hay al menos una categoría.
   */
  readonly equipmentSection = computed<Section | null>(() => {
    const cats = new Set<string>();
    for (const v of this.versions()) {
      for (const ei of v.equipmentItems ?? []) {
        const c = ei.equipmentItem.category;
        if (c) cats.add(c);
      }
    }
    if (cats.size === 0) return null;
    const sorted = [...cats].sort((a, b) => a.localeCompare(b));
    return {
      name: 'equipamiento',
      label: 'Equipamiento',
      rows: sorted.map((category) => ({
        kind: 'equipmentList',
        label: category,
        category,
      })),
    };
  });

  /**
   * Lista completa de secciones que se renderizan. Inyecta la sección de
   * Equipamiento entre "Precio y Año" y "Costos" (índice 2 en staticSections).
   */
  readonly sections = computed<ReadonlyArray<Section>>(() => {
    const eq = this.equipmentSection();
    if (!eq) return this.staticSections;
    return [...this.staticSections.slice(0, 2), eq, ...this.staticSections.slice(2)];
  });

  /**
   * Por cada fila con dirección "mejor", los ids de versión que ganan.
   *
   * Reglas deliberadas:
   * - Si a alguna versión le falta el dato, la fila **no** se marca: decir que
   *   un auto "gana" en maletero porque el otro no tiene el dato cargado sería
   *   mentirle al usuario.
   * - Si todas empatan, tampoco se marca: no hay nada que decidir ahí.
   * - Si empatan varias en el mejor valor (pero no todas), se marcan todas y la
   *   UI lo dice como empate.
   */
  readonly rowWinners = computed<Map<string, Set<string>>>(() => {
    const out = new Map<string, Set<string>>();
    const vs = this.versions();
    if (vs.length < 2) return out;

    for (const section of this.sections()) {
      for (const row of section.rows) {
        if (row.kind !== 'simple' || !row.better || !row.numeric) continue;
        const values = vs.map((v) => {
          const n = row.numeric!(v);
          return typeof n === 'number' && Number.isFinite(n) ? n : null;
        });
        if (values.some((n) => n === null)) continue;
        const nums = values as number[];
        const best = row.better === 'lower' ? Math.min(...nums) : Math.max(...nums);
        if (nums.every((n) => n === best)) continue;
        const winners = new Set<string>();
        vs.forEach((v, i) => {
          if (nums[i] === best) winners.add(v.id);
        });
        out.set(row.key, winners);
      }
    }
    return out;
  });

  isWinner(row: CompareRow, versionId: string): boolean {
    if (row.kind !== 'simple') return false;
    return this.rowWinners().get(row.key)?.has(versionId) ?? false;
  }

  /** Un empate en el mejor valor entre varias versiones (pero no todas). */
  isTie(row: CompareRow): boolean {
    if (row.kind !== 'simple') return false;
    return (this.rowWinners().get(row.key)?.size ?? 0) > 1;
  }

  /** Texto del sello: "mejor" o "empate", según corresponda. */
  winnerLabel(row: CompareRow): string {
    return this.isTie(row) ? 'Empate' : 'Mejor';
  }

  winnerAriaLabel(row: CompareRow): string {
    if (row.kind !== 'simple') return '';
    const dir = row.better === 'lower' ? 'el más bajo' : 'el más alto';
    return this.isTie(row)
      ? `Empate en ${row.label}: ${dir} junto a otra versión`
      : `Mejor ${row.label}: ${dir} de las versiones comparadas`;
  }

  /**
   * Devuelve los nombres de los items de una categoría para una versión,
   * separados por coma. `—` si la versión no tiene items en esa categoría.
   */
  formatEquipmentByCategory(v: CompareVersion, category: string): string {
    const names = (v.equipmentItems ?? [])
      .filter((ei) => ei.equipmentItem.category === category)
      .map((ei) => ei.equipmentItem.name);
    return names.length > 0 ? names.join(', ') : '—';
  }

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        void this.loadFavorites();
      } else {
        this.favoriteModels.set([]);
      }
    });

    // Título de la comparación, para que compartir el link diga qué se está
    // comparando. Corre después del default de la ruta (que se aplica en
    // `NavigationEnd`) y sirve igual entrando por /compare que por /c/:slug,
    // porque depende de `versions()` y no de cómo se cargaron.
    effect(() => {
      const vs = this.versions();
      // Con menos de dos autos no hay comparación que anunciar, y hay que
      // *escribir* el default, no sólo abstenerse: `removeFromCompare()` saca
      // una columna sin navegar, así que nadie más va a corregir la metadata.
      // Sin esto, el <title> y los og:* seguirían prometiendo una comparación
      // de dos autos que ya no está en pantalla.
      if (vs.length < 2) {
        this.pageMeta.set(COMPARE_DEFAULT_META);
        return;
      }
      const names = vs.map((v) => this.fullName(v));
      this.pageMeta.set({
        title: `${names.join(' vs ')} — comparación | cualautocompro`,
        description:
          `Comparación lado a lado de ${names.join(' vs ')}: precio, ` +
          `rendimiento, equipamiento y costo anual estimado.`,
        // Coherente con el default de la ruta: las comparaciones guardadas se
        // comparten por link, pero no se indexan.
        noindex: true,
      });
    });

    // Suscripción y no `route.snapshot`: estando ya en /compare, navegar a
    // /compare?slug=xxx (lo que hace el link "Ver enlace público") no recrea el
    // componente, así que con el snapshot la URL cambiaba y la vista no.
    // `queryParamMap` y `paramMap` emiten el valor actual al suscribirse, así
    // que la primera pasada equivale al bootstrap de antes.
    let resolveReady!: () => void;
    this.ready = new Promise<void>((resolve) => (resolveReady = resolve));
    let firstRun = true;
    combineLatest([this.route.queryParamMap, this.route.paramMap])
      .pipe(takeUntilDestroyed())
      .subscribe(([queryParams, params]) => {
        const key = this.routeKey(queryParams, params);
        if (key === this.lastRouteKey) return;
        this.lastRouteKey = key;
        const done = this.bootstrapInner(queryParams, params);
        if (firstRun) {
          firstRun = false;
          void done.then(resolveReady);
        }
      });
  }

  /** Identidad de la ruta para no re-bootstrapear con los mismos params. */
  private lastRouteKey: string | null = null;

  private routeKey(queryParams: ParamMap, params: ParamMap): string {
    return [
      queryParams.get('slug') ?? params.get('slug') ?? '',
      queryParams.get('ids') ?? '',
    ].join('|');
  }

  private async bootstrapInner(
    qp: ParamMap,
    routeParams: ParamMap,
  ): Promise<void> {
    const slug = qp.get('slug') ?? routeParams.get('slug');
    if (slug) {
      await this.loadBySlug(slug);
      return;
    }

    const idsParam = qp.get('ids');
    if (idsParam) {
      this.compareStore.hydrateFromUrl(idsParam);
      this.loading.set(true);
      try {
        const ids = this.compareStore.ids();
        if (ids.length === 0) {
          this.versions.set([]);
          return;
        }
        const res = await this.api.get<{ data: CompareResponse }>('/compare', {
          ids: ids.join(','),
        });
        this.applyResponse(res.data);
      } finally {
        this.loading.set(false);
      }
      return;
    }

    const ids = this.compareStore.ids();
    if (ids.length === 0) {
      return;
    }
    this.loading.set(true);
    try {
      const res = await this.api.post<{ data: CompareResponse }>('/compare', {
        versionIds: ids,
      });
      this.applyResponse(res.data);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBySlug(slug: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const res = await this.api.get<{ data: ComparisonBySlugResponse }>(
        `/comparisons/${encodeURIComponent(slug)}`,
      );
      const cmp = res.data;
      const items = Array.isArray(cmp.items)
        ? cmp.items.slice().sort((a, b) => a.position - b.position)
        : [];
      this.sharedMeta.set({
        slug: cmp.slug,
        createdAt: cmp.createdAt,
        userId: cmp.userId,
      });
      const ids = items.map((it) => it.versionId);
      this.compareStore.hydrateFromUrl(ids.join(','));

      if (ids.length === 0) {
        this.versions.set([]);
        this.diffHighlights.set({});
        return;
      }

      // `/comparisons/:slug` devuelve la versión "pelada" (solo model + brand) y
      // sin `diffHighlights`, así que quien abría el link compartido veía una
      // comparación degradada: sin equipamiento, sin mantención, sin "Cambiar
      // versión" y sin las diferencias resaltadas. Pedimos el payload completo
      // a `/compare` con los ids recuperados.
      try {
        const full = await this.api.post<{ data: CompareResponse }>('/compare', {
          versionIds: ids,
        });
        this.applyResponse(full.data);
      } catch {
        // Si `/compare` falla, mostramos al menos lo que trajo el slug.
        this.versions.set(items.map((it) => it.version));
        this.diffHighlights.set({});
      }
    } catch {
      this.loadError.set('No encontramos esta comparación guardada.');
    } finally {
      this.loading.set(false);
    }
  }

  formatSharedDate(value: string): string {
    try {
      return new Date(value).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return value;
    }
  }

  private applyResponse(data: CompareResponse): void {
    this.versions.set(data.versions ?? []);
    this.diffHighlights.set(data.diffHighlights ?? {});
  }

  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `$${new Intl.NumberFormat('es-CL').format(value)}`;
  }

  formatPricePlain(value: number): string {
    return new Intl.NumberFormat('es-CL').format(value);
  }

  // Expuestos al template para los chips de la ficha (ver `.html`).
  readonly fuelLabel = fuelLabel;
  readonly transmissionLabel = transmissionLabel;

  favoriteSegmentLabel(m: VehicleCardInput): string {
    return segmentLabel(m.segment ?? '');
  }

  favoriteVersionSummary(
    m: VehicleCardInput,
  ): { name: string; year: number; fuel: string | null; transmission: string | null } | null {
    const version = m.defaultVersion ?? m.versions[0] ?? null;
    if (!version) return null;
    return {
      name: version.name,
      year: version.year,
      fuel: fuelLabel(version.fuel) || null,
      transmission: transmissionLabel(version.transmission) || null,
    };
  }

  /**
   * Ruta a la ficha del modelo. El comparador era un callejón sin salida: se
   * veía el nombre del auto pero no había forma de abrir su ficha para mirar
   * fotos o el resto del equipamiento.
   *
   * `null` si falta la marca o el modelo, para no armar un link roto.
   */
  detailUrl(v: CompareVersion): unknown[] | null {
    const brand = v.model?.brand?.name;
    const model = v.model?.name;
    if (!brand || !model) return null;
    return ['/brand', slugify(brand), 'model', slugify(model)];
  }

  /** Cuántos huecos quedan para llegar a 3. */
  readonly freeSlots = computed(() => Math.max(0, 3 - this.versions().length));

  fullName(v: CompareVersion): string {
    const brand = v.model?.brand?.name ?? '';
    const model = v.model?.name ?? '';
    return [brand, model, v.name].filter(Boolean).join(' ');
  }

  brandLine(v: CompareVersion): string {
    const brand = v.model?.brand?.name ?? '';
    const model = v.model?.name ?? '';
    return [brand, model].filter(Boolean).join(' ');
  }

  isDiff(key: DiffKey): boolean {
    return Boolean(this.diffHighlights()[key]);
  }

  /**
   * ¿Esta fila difiere entre las versiones comparadas?
   *
   * Para las filas `simple` manda `diffHighlights`, que calcula el backend. Las
   * de equipamiento y mantención no viajan ahí, así que se comparan acá con lo
   * que ya se muestra en pantalla — si dos versiones traen el mismo texto, la
   * fila no aporta a la decisión.
   */
  rowDiffers(row: CompareRow): boolean {
    const vs = this.versions();
    if (vs.length < 2) return true;
    if (row.kind === 'simple') return this.isDiff(row.key);
    if (row.kind === 'equipmentList') {
      const first = this.formatEquipmentByCategory(vs[0], row.category);
      return vs.some((v) => this.formatEquipmentByCategory(v, row.category) !== first);
    }
    const key = (v: CompareVersion) =>
      JSON.stringify(
        [...(v.maintenanceCosts ?? [])]
          .sort((a, b) => a.mileageTag - b.mileageTag)
          .map((m) => [m.mileageTag, m.costClp]),
      );
    const first = key(vs[0]);
    return vs.some((v) => key(v) !== first);
  }

  // ---------------------------------------------------------------------------
  // Costo anual de uso
  //
  // Vivía solo en la ficha del modelo, que es donde menos sirve: comparar el
  // costo de tener el auto un año es exactamente lo que decide entre dos
  // alternativas de precio parecido. El input de km/año es uno solo para las
  // tres columnas — comparar con supuestos distintos por versión no diría nada.
  // ---------------------------------------------------------------------------

  readonly kmPerYear = signal(DEFAULT_KM_PER_YEAR);
  readonly maxKm = MAX_KM_PER_YEAR;
  readonly costs = signal<Map<string, CostBreakdown>>(new Map());
  readonly costsLoading = signal(false);
  readonly costsError = signal<string | null>(null);
  /** Espera antes de recalcular al editar km/año. Los tests lo bajan a 0. */
  costDebounceMs = 400;
  private costDebounce: ReturnType<typeof setTimeout> | null = null;

  onKmPerYearChange(value: number | string): void {
    const km = clampKmPerYear(value);
    if (km === null) return;
    this.kmPerYear.set(km);
    if (this.costDebounce !== null) clearTimeout(this.costDebounce);
    if (this.costDebounceMs <= 0) {
      void this.loadCosts();
      return;
    }
    this.costDebounce = setTimeout(() => {
      this.costDebounce = null;
      void this.loadCosts();
    }, this.costDebounceMs);
  }

  /** Un request por versión (máximo 3). Si una falla, las demás se muestran. */
  async loadCosts(): Promise<void> {
    const vs = this.versions();
    if (vs.length === 0) {
      this.costs.set(new Map());
      return;
    }
    const km = this.kmPerYear();
    this.costsLoading.set(true);
    this.costsError.set(null);
    const results = await Promise.all(
      vs.map(async (v) => {
        try {
          return [v.id, await this.annualCost.fetch(v.id, km)] as const;
        } catch {
          return [v.id, null] as const;
        }
      }),
    );
    const map = new Map<string, CostBreakdown>();
    for (const [id, cost] of results) {
      if (cost) map.set(id, cost);
    }
    this.costs.set(map);
    this.costsLoading.set(false);
    if (map.size === 0) {
      this.costsError.set('No pudimos calcular el costo anual de estas versiones.');
    }
  }

  costFor(versionId: string): CostBreakdown | null {
    return this.costs().get(versionId) ?? null;
  }

  /**
   * Se calcula al abrir la sección, no al cargar la comparación: son hasta 3
   * requests y no tiene sentido pagarlos si el usuario no mira esta sección.
   * Si ya están calculados para estas mismas versiones, no se repite.
   */
  onCostsPanelOpened(): void {
    const vs = this.versions();
    const map = this.costs();
    if (vs.length > 0 && vs.every((v) => map.has(v.id))) return;
    void this.loadCosts();
  }

  /** Filas del desglose, en el mismo orden que la tarjeta de la ficha. */
  readonly costRows: ReadonlyArray<{
    label: string;
    pick: (c: CostBreakdown) => number;
  }> = [
    { label: 'Combustible', pick: (c) => c.fuelClp },
    { label: 'Mantención', pick: (c) => c.maintenanceClp },
    { label: 'Permiso de circulación', pick: (c) => c.circulationPermitClp },
    { label: 'Seguro obligatorio', pick: (c) => c.mandatoryInsuranceClp },
    { label: 'Seguro automotriz', pick: (c) => c.voluntaryInsuranceClp },
    { label: 'Depreciación', pick: (c) => c.depreciationClp },
  ];

  /**
   * Qué componentes del costo tienen dato (> 0) para una versión.
   *
   * El backend devuelve 0 tanto para "no aplica" como para "no hay dato
   * cargado", así que un auto sin precio de combustible ni seguros registrados
   * termina con un total que es solo depreciación — y parecería el más barato
   * de mantener sin serlo.
   */
  private costSignature(c: CostBreakdown): string {
    return this.costRows.map((r) => (r.pick(c) > 0 ? '1' : '0')).join('');
  }

  /**
   * ¿Los desgloses son comparables entre sí? Solo lo son si todas las versiones
   * tienen dato en los mismos componentes; si no, comparar los totales es
   * comparar peras con manzanas.
   */
  readonly costsComparable = computed(() => {
    const vs = this.versions();
    const map = this.costs();
    if (vs.length < 2 || map.size !== vs.length) return false;
    const sigs = vs.map((v) => this.costSignature(map.get(v.id)!));
    return sigs.every((s) => s === sigs[0]);
  });

  /** Nombres de los componentes sin dato en alguna versión, para avisarlo. */
  readonly costsMissing = computed<string[]>(() => {
    const vs = this.versions();
    const map = this.costs();
    if (map.size === 0) return [];
    return this.costRows
      .filter((r) =>
        vs.some((v) => {
          const c = map.get(v.id);
          return !c || r.pick(c) === 0;
        }),
      )
      .map((r) => r.label);
  });

  /**
   * Ids de las versiones con el costo anual más bajo. Mismo criterio que
   * `rowWinners`: si a alguna le falta el cálculo —o si los desgloses no son
   * comparables— no se marca nada.
   */
  readonly cheapestToOwn = computed<Set<string>>(() => {
    const vs = this.versions();
    const map = this.costs();
    if (!this.costsComparable()) return new Set();
    const totals = vs.map((v) => map.get(v.id)!.totalClp);
    const best = Math.min(...totals);
    if (totals.every((t) => t === best)) return new Set();
    const winners = new Set<string>();
    vs.forEach((v, i) => {
      if (totals[i] === best) winners.add(v.id);
    });
    return winners;
  });

  isCheapestToOwn(versionId: string): boolean {
    return this.cheapestToOwn().has(versionId);
  }

  /**
   * "Solo diferencias": la razón por la que alguien abre un comparador es ver
   * en qué se distinguen dos autos, no releer las 20 filas donde son idénticos.
   */
  readonly onlyDiffs = signal(false);

  toggleOnlyDiffs(): void {
    this.onlyDiffs.update((v) => !v);
  }

  /** Secciones ya filtradas por el toggle; las que quedan vacías se omiten. */
  readonly visibleSections = computed<ReadonlyArray<Section>>(() => {
    const all = this.sections();
    if (!this.onlyDiffs()) return all;
    return all
      .map((s) => ({ ...s, rows: s.rows.filter((r) => this.rowDiffers(r)) }))
      .filter((s) => s.rows.length > 0);
  });

  /** Cuántas filas esconde el toggle, para poder decirlo en la UI. */
  readonly hiddenRowCount = computed(() => {
    const total = this.sections().reduce((n, s) => n + s.rows.length, 0);
    const shown = this.visibleSections().reduce((n, s) => n + s.rows.length, 0);
    return total - shown;
  });

  sectionIcon(name: string): string {
    switch (name) {
      case 'specs':
        return 'analytics';
      case 'precio-anio':
        return 'payments';
      case 'equipamiento':
        return 'inventory_2';
      case 'costos':
        return 'payments';
      default:
        return 'analytics';
    }
  }

  trackById(_: number, v: CompareVersion): string {
    return v.id;
  }

  trackByRow(_: number, row: CompareRow): string {
    if (row.kind === 'simple') return row.key;
    if (row.kind === 'equipmentList') return `equipment-${row.category}`;
    return 'maintenance-breakdown';
  }

  trackBySection(_: number, s: Section): string {
    return s.name;
  }

  removeFromCompare(id: string): void {
    this.compareStore.remove(id);
    this.versions.update((vs) => vs.filter((v) => v.id !== id));
  }

  toggleSwap(versionId: string): void {
    this.swappingFor.update((current) => (current === versionId ? null : versionId));
  }

  closeSwap(): void {
    this.swappingFor.set(null);
  }

  openMaintPopover(versionId: string): void {
    this.maintPopoverFor.update((cur) => (cur === versionId ? null : versionId));
  }

  closeMaintPopover(): void {
    this.maintPopoverFor.set(null);
  }

  availableVersionsFor(v: CompareVersion): AvailableVersionLite[] {
    return v.model?.availableVersions ?? [];
  }

  async swapVersion(currentVersionId: string, newVersionId: string): Promise<void> {
    const currentIds = this.compareStore.ids();
    const newIds = currentIds.map((id) => (id === currentVersionId ? newVersionId : id));
    this.compareStore.setIds(newIds);
    this.closeSwap();
    await this.reloadCompare();
  }

  private async reloadCompare(): Promise<void> {
    const ids = this.compareStore.ids();
    if (ids.length === 0) {
      this.versions.set([]);
      return;
    }
    this.loading.set(true);
    try {
      const res = await this.api.post<{ data: CompareResponse }>('/compare', {
        versionIds: ids,
      });
      this.applyResponse(res.data);
    } finally {
      this.loading.set(false);
    }
  }

  async loadFavorites(): Promise<void> {
    if (!this.user()) return;
    try {
      const res = await this.api.get<{ data: VehicleCardInput[] }>(
        '/me/favorites/models',
      );
      this.favoriteModels.set(res.data ?? []);
    } catch {
      /* ignore */
    }
  }

  isModelInCompare(m: VehicleCardInput): boolean {
    const inStore = new Set(this.compareStore.ids());
    return m.versions.some((v) => inStore.has(v.id));
  }

  thumbStyle(url: string | null | undefined): string {
    const resolved = toAbsoluteUploadUrl(url);
    return resolved ? `url("${resolved}")` : 'none';
  }

  versionsForModel(modelId: string): AvailableVersionLite[] {
    const m = this.favoriteModels().find((x) => x.id === modelId);
    return (m?.versions ?? []) as AvailableVersionLite[];
  }

  async addFavoriteVersionToCompare(
    modelId: string,
    versionId: string,
  ): Promise<void> {
    if (this.compareStore.ids().length >= 3) return;
    this.compareStore.setIds([...this.compareStore.ids(), versionId]);
    await this.reloadCompare();
  }

  clearAll(): void {
    this.compareStore.clear();
    this.versions.set([]);
    this.router.navigate(['/compare']);
  }

  async saveComparison(): Promise<void> {
    const ids = this.compareStore.ids();
    if (ids.length === 0) return;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const name = this.saveName().trim();
      const res = await this.api.post<{
        data: { slug: string };
      }>('/me/comparisons', { versionIds: ids, ...(name ? { name } : {}) });
      this.savedSlug.set(res.data.slug);
      this.duplicateSlug.set(null);
    } catch (e) {
      const err = e as {
        status?: number;
        error?: { error?: { code?: string; slug?: string; message?: string } };
      };
      const dup = err?.error?.error;
      if (err?.status === 409 && dup?.code === 'COMPARISON_DUPLICATE' && dup.slug) {
        this.duplicateSlug.set(dup.slug);
        this.savedSlug.set(dup.slug);
        this.snackBar.open('Ya tenés esta comparación guardada.', 'Cerrar', {
          duration: 5000,
        });
      } else {
        this.saveError.set(
          'No pudimos guardar la comparación. Intentá de nuevo.',
        );
        this.snackBar.open('No pudimos guardar la comparación. Intentá de nuevo.', 'Cerrar', {
          duration: 5000,
          panelClass: 'snack-error',
        });
      }
    } finally {
      this.saving.set(false);
    }
  }
}
