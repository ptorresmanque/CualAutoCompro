import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CompareStore } from '../../core/compare-store.service';
import { toAbsoluteUploadUrl } from '../../core/upload-url';
import { VehicleCardInput } from '../../shared/ui/vehicle-card.component';
import { versionFieldLabel } from '../../core/types/version-labels';

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

type CompareRow =
  | { kind: 'simple'; key: DiffKey; label: string; format: (v: CompareVersion) => string }
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
  private auth = inject(AuthService);
  private compareStore = inject(CompareStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

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

  readonly disclaimerText =
    'Las celdas resaltadas en ámbar indican diferencias relevantes entre las versiones seleccionadas.';

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
        },
        {
          kind: 'simple',
          key: 'torqueNm',
          label: 'Torque',
          format: (v) => (v.torqueNm ? `${v.torqueNm} Nm` : '—'),
        },
        {
          kind: 'simple',
          key: 'consumptionCityKmL',
          label: 'Consumo ciudad',
          format: (v) => (v.consumptionCityKmL ? `${v.consumptionCityKmL} km/L` : '—'),
        },
        {
          kind: 'simple',
          key: 'consumptionHighwayKmL',
          label: 'Consumo carretera',
          format: (v) => (v.consumptionHighwayKmL ? `${v.consumptionHighwayKmL} km/L` : '—'),
        },
        {
          kind: 'simple',
          key: 'transmission',
          label: 'Transmisión',
          format: (v) => v.transmission ?? '—',
        },
        {
          kind: 'simple',
          key: 'fuel',
          label: 'Combustible',
          format: (v) => v.fuel ?? '—',
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
        },
        {
          kind: 'simple',
          key: 'mandatoryInsuranceClp',
          label: 'Seguro obligatorio (SOAP)',
          format: (v) => (v.mandatoryInsuranceClp ? this.formatPrice(v.mandatoryInsuranceClp) : '—'),
        },
        {
          kind: 'simple',
          key: 'voluntaryInsuranceClp',
          label: 'Seguro automotriz',
          format: (v) => (v.voluntaryInsuranceClp ? this.formatPrice(v.voluntaryInsuranceClp) : '—'),
        },
        {
          kind: 'simple',
          key: 'computedFillCostClp',
          label: 'Llenar estanque',
          format: (v) => (v.computedFillCostClp ? this.formatPrice(v.computedFillCostClp) : '—'),
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
    this.ready = this.bootstrap();
  }

  private bootstrap(): Promise<void> {
    return this.bootstrapInner();
  }

  private async bootstrapInner(): Promise<void> {
    const qp = this.route.snapshot.queryParamMap;
    const slug = qp.get('slug') ?? this.route.snapshot.paramMap.get('slug');
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
      this.versions.set(
        Array.isArray(cmp.items)
          ? cmp.items
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((it) => it.version)
          : [],
      );
      this.diffHighlights.set({});
      this.sharedMeta.set({
        slug: cmp.slug,
        createdAt: cmp.createdAt,
        userId: cmp.userId,
      });
      this.compareStore.hydrateFromUrl(
        cmp.items.map((it) => it.versionId).join(','),
      );
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

  favoriteSegmentLabel(m: VehicleCardInput): string {
    return this.segmentToLabel(m.segment ?? '');
  }

  favoriteVersionSummary(
    m: VehicleCardInput,
  ): { name: string; year: number; fuel: string | null; transmission: string | null } | null {
    const version = m.defaultVersion ?? m.versions[0] ?? null;
    if (!version) return null;
    return {
      name: version.name,
      year: version.year,
      fuel: version.fuel ?? null,
      transmission: version.transmission ?? null,
    };
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

  cellClass(key: DiffKey): string {
    return this.isDiff(key) ? 'row-diff' : '';
  }

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
