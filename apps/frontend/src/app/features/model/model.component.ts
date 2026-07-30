import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import { CompareStore } from '../../core/compare-store.service';
import { PopularityService } from '../../core/popularity.service';
import { FavoritesStore } from '../../core/favorites-store.service';
import { toAbsoluteUploadUrl } from '../../core/upload-url';
import { slugify } from '../../core/slug';
import { PageMetaService } from '../../core/page-meta.service';
import { DisclaimerComponent } from '../../shared/ui/disclaimer.component';
import { AnnualCostCardComponent } from './annual-cost-card.component';
import { versionFieldLabel } from '../../core/types/version-labels';
import { fuelLabel, segmentLabel, transmissionLabel } from '../../core/types/catalog-labels';

interface Brand {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface BrandModel {
  id: string;
  name: string;
  segment: string;
}

interface ModelVersion {
  id: string;
  name: string;
  priceClp: number | null;
  year: number | null;
  fuel?: string | null;
  transmission?: string | null;
  traction?: string | null;
  engineType?: string | null;
  powerHp?: number | null;
  torqueNm?: number | null;
  engineDisplacementCc?: number | null;
  consumptionCityKmL?: number | null;
  consumptionHighwayKmL?: number | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  weightKg?: number | null;
  trunkLiters?: number | null;
  hasRecall?: boolean | null;
  recallUrl?: string | null;
  equipmentItems?: { equipmentItem: { name: string; category: string } }[];
}

interface BrandDealer {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
}

interface ModelDetail {
  id: string;
  name: string;
  segment: string;
  brandId: string;
  brandName: string;
  brand: { name: string };
  versions: ModelVersion[];
  galleryUrls?: string[];
}

interface SpecRow {
  label: string;
  value: string;
  zebra: boolean;
}

interface SpecGroup {
  title: string;
  icon: string;
  rows: SpecRow[];
}

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrl: './model.component.css',
  imports: [
    AnnualCostCardComponent,
    RouterLink,
    DisclaimerComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTabsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelComponent {
  private api = inject(ApiService);
  private compare = inject(CompareStore);
  private popularity = inject(PopularityService);
  readonly favorites = inject(FavoritesStore);
  private route = inject(ActivatedRoute);
  private pageMeta = inject(PageMetaService);

  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  loading = signal(false);
  error = signal<string | null>(null);
  brand = signal<Brand | null>(null);
  model = signal<ModelDetail | null>(null);

  readonly versions = computed<ModelVersion[]>(() => this.model()?.versions ?? []);
  readonly galleryUrls = computed<string[]>(() => this.model()?.galleryUrls ?? []);
  readonly galleryUrlsAbsolute = computed<string[]>(() =>
    this.galleryUrls().map((u) => toAbsoluteUploadUrl(u) ?? u),
  );
  readonly dealers = signal<BrandDealer[]>([]);
  readonly hasGallery = computed(() => this.galleryUrls().length > 0);

  readonly selectedIds = this.compare.ids;
  readonly maxSelected = computed(() => this.selectedIds().length >= 3);

  readonly currentIndex = signal(0);
  readonly currentUrl = computed(() => {
    const raw = this.galleryUrls()[this.currentIndex()] ?? '';
    return toAbsoluteUploadUrl(raw) ?? raw;
  });
  private readonly _hovered = signal(false);
  readonly hovered = this._hovered.asReadonly();

  /**
   * En touch no hay hover, así que las flechas del carrusel quedaban en
   * `opacity-0` + `pointer-events-none` de forma permanente: en celular solo se
   * podía cambiar de imagen con los dots. Acá se fuerzan visibles.
   */
  readonly navAlwaysVisible = signal(false);

  readonly activeTabIndex = signal(0);

  /** Versión de la tab abierta: es la que alimenta el costo anual. */
  readonly activeVersion = computed<ModelVersion | null>(
    () => this.versions()[this.activeTabIndex()] ?? null,
  );

  setActiveTabIndex(i: number): void {
    this.activeTabIndex.set(i);
  }

  readonly segmentLabel = computed(() => segmentLabel(this.model()?.segment));

  // Expuestos al template para el chip de transmisión y la línea de motor.
  readonly fuelLabel = fuelLabel;
  readonly transmissionLabel = transmissionLabel;

  /**
   * Grupos de ficha técnica por versión, indexados por id.
   *
   * Es un `computed` y no una llamada desde el template: `buildSpecGroups(v)`
   * en la plantilla se re-ejecutaba en cada detección de cambios para cada
   * versión, recreando todos los arrays.
   */
  readonly specGroupsByVersion = computed<Map<string, SpecGroup[]>>(() => {
    const out = new Map<string, SpecGroup[]>();
    for (const v of this.versions()) out.set(v.id, this.buildSpecGroups(v));
    return out;
  });

  specGroupsFor(versionId: string): SpecGroup[] {
    return this.specGroupsByVersion().get(versionId) ?? [];
  }

  buildSpecGroups(v: ModelVersion): SpecGroup[] {
    const groups: SpecGroup[] = [
      {
        title: 'Motorización',
        icon: 'settings_suggest',
        rows: [
          { label: 'Desplazamiento', value: v.engineDisplacementCc ? `${(v.engineDisplacementCc / 1000).toFixed(1)} L` : '—', zebra: false },
          { label: 'Potencia', value: v.powerHp ? `${v.powerHp} HP` : '—', zebra: true },
          { label: 'Torque', value: v.torqueNm ? `${v.torqueNm} Nm` : '—', zebra: false },
          { label: 'Combustible', value: fuelLabel(v.fuel) || '—', zebra: true },
          { label: 'Transmisión', value: transmissionLabel(v.transmission) || '—', zebra: false },
          { label: 'Tracción', value: versionFieldLabel(v.traction), zebra: true },
          ...(v.fuel !== 'ELECTRIC' ? [{ label: 'Tipo motor', value: versionFieldLabel(v.engineType), zebra: false }] : []),
          {
            // "Rendimiento" y `km/L`, igual que el catálogo y el comparador:
            // acá decía "Consumo" y "km/l", tres nombres para el mismo dato.
            label: 'Rendimiento ciudad / carretera',
            value: v.consumptionCityKmL && v.consumptionHighwayKmL
              ? `${v.consumptionCityKmL} / ${v.consumptionHighwayKmL} km/L`
              : '—',
            zebra: true,
          },
        ],
      },
      {
        title: 'Dimensiones y Pesos',
        icon: 'straighten',
        rows: [
          {
            label: 'Largo / Ancho / Alto',
            value:
              v.lengthMm && v.widthMm && v.heightMm
                ? `${v.lengthMm} / ${v.widthMm} / ${v.heightMm} mm`
                : '—',
            zebra: false,
          },
          { label: 'Peso', value: v.weightKg ? `${v.weightKg} kg` : '—', zebra: true },
          { label: 'Maletero', value: v.trunkLiters ? `${v.trunkLiters} L` : '—', zebra: false },
        ],
      },
    ];

    // Equipamiento agrupado por categoría, igual que el comparador: antes cada
    // fila era `label = nombre / value = categoría`, y se leía "Airbags |
    // Seguridad", como si la categoría fuera el valor del ítem.
    const items = v.equipmentItems ?? [];
    if (items.length > 0) {
      const byCategory = new Map<string, string[]>();
      for (const ei of items) {
        const category = ei.equipmentItem.category || 'Otros';
        const list = byCategory.get(category) ?? [];
        list.push(ei.equipmentItem.name);
        byCategory.set(category, list);
      }
      const categories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b));
      groups.push({
        title: 'Equipamiento',
        icon: 'inventory_2',
        rows: categories.map((category, idx) => ({
          label: category,
          value: (byCategory.get(category) ?? [])
            .sort((a, b) => a.localeCompare(b))
            .join(', '),
          zebra: idx % 2 === 1,
        })),
      });
    }

    return groups;
  }

  readonly initialLoad: Promise<void>;

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(hover: none)');
      this.navAlwaysVisible.set(mq.matches);
      mq.addEventListener('change', (e) => this.navAlwaysVisible.set(e.matches));
    }
    this.updatePageMeta();
    this.initialLoad = this.bootstrap();
  }

  /**
   * Título y previsualización de la ficha, una vez que llegó el modelo.
   *
   * El default de la ruta ya se aplicó en `NavigationEnd`; este `effect` corre
   * después, cuando resuelve el HTTP, y lo sobreescribe. Mientras no haya
   * modelo no toca nada: pisar la metadata con un título a medio armar es peor
   * que dejar el default.
   */
  private updatePageMeta(): void {
    effect(() => {
      const model = this.model();
      if (!model) return;
      const brandName = this.brand()?.name ?? model.brandName ?? model.brand?.name ?? '';
      const fullName = [brandName, model.name].filter(Boolean).join(' ');
      const versions = this.versions();
      const prices = versions
        .map((v) => v.priceClp)
        .filter((p): p is number => typeof p === 'number' && Number.isFinite(p));
      const from = prices.length > 0 ? this.formatPrice(Math.min(...prices)) : '—';

      this.pageMeta.set({
        title: `${fullName} — ficha técnica y precios en Chile`,
        description:
          `Ficha técnica del ${fullName}: ${versions.length} versiones, ` +
          `precios desde ${from}, equipamiento y costo anual estimado.`,
        image: this.galleryUrlsAbsolute()[0],
        // `slugify` y no `toLowerCase()`: es el mismo slug que resuelve el
        // backend, así que marcas con espacio o acento ("Great Wall",
        // "Citroën") apuntan a la URL que realmente existe.
        path: `/brand/${slugify(brandName)}/model/${slugify(model.name)}`,
      });
    });
  }

  prev(): void {
    this.nextOrPrev(-1);
  }

  next(): void {
    this.nextOrPrev(+1);
  }

  goTo(i: number): void {
    const n = this.galleryUrls().length;
    if (i < 0 || i >= n) return;
    this.currentIndex.set(i);
  }

  onCarouselHover(state: boolean): void {
    this._hovered.set(state);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    if (
      !this.hasGallery() ||
      ev.target instanceof HTMLInputElement ||
      ev.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    if (ev.key === 'ArrowLeft') this.prev();
    else if (ev.key === 'ArrowRight') this.next();
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleVersion(id: string): void {
    if (this.isSelected(id)) this.compare.remove(id);
    else { this.compare.add(id); this.popularity.recordAdd(id); }
  }

  async toggleFavorite(versionId: string): Promise<void> {
    const modelId = this.model()?.id;
    if (!modelId) return;
    try {
      await this.favorites.toggle({ modelId, versionId });
    } catch {
      this.error.set('Inicia sesión para guardar favoritos.');
    }
  }

  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `$${new Intl.NumberFormat('es-CL').format(value)}`;
  }

  async loadBrandDealers(brandId: string): Promise<void> {
    try {
      const res = await this.api.get<{ data: BrandDealer[] }>(
        `/brands/${brandId}/dealers`,
      );
      this.dealers.set(res.data ?? []);
    } catch {
      this.dealers.set([]);
    }
  }

  private nextOrPrev(delta: number): void {
    const n = this.galleryUrls().length;
    if (n === 0) return;
    this.currentIndex.update((i) => (i + delta + n) % n);
  }

  private async bootstrap(): Promise<void> {
    const p = this.params();
    const brandSlug = (p.get('brandSlug') ?? '').trim();
    const modelSlug = (p.get('modelSlug') ?? '').trim();
    if (!brandSlug || !modelSlug) {
      this.error.set('URL inválida.');
      return;
    }
    this.loading.set(true);
    try {
      // Single server-side lookup by brandSlug/modelSlug
      const detailRes = await this.api
        .get<{ data: ModelDetail; error: { code: string; message: string } | null }>(
          `/models/by-slug/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}`,
        )
        .catch(async () => {
          // Fallback to legacy client-side lookup if the endpoint is missing.
          return await this.bootstrapLegacy(brandSlug, modelSlug);
        });
      const detail = (detailRes as { data: ModelDetail | null }).data;
      if (!detail) {
        this.error.set(`Modelo "${modelSlug}" no encontrado.`);
        return;
      }
      this.model.set(detail);
      this.brand.set({ id: detail.brandId, name: detail.brandName ?? detail.brand?.name ?? '' } as Brand);
      await this.loadBrandDealers(detail.brandId);
    } catch {
      this.error.set('No se pudo cargar el modelo.');
    } finally {
      this.loading.set(false);
    }
  }

  private async bootstrapLegacy(brandSlug: string, modelSlug: string): Promise<{ data: ModelDetail | null }> {
    const brandsRes = await this.api.get<{ data: Brand[] }>('/brands');
    const brand = brandsRes.data.find(
      (b) => slugify(b.name) === slugify(brandSlug),
    );
    if (!brand) {
      this.error.set(`Marca "${brandSlug}" no encontrada.`);
      return { data: null };
    }
    this.brand.set(brand);
    const modelsRes = await this.api.get<{ data: BrandModel[] }>(
      `/brands/${brand.id}/models`,
    );
    const brandModel = modelsRes.data.find(
      (m) => slugify(m.name) === slugify(modelSlug),
    );
    if (!brandModel) {
      this.error.set(
        `Modelo "${modelSlug}" no encontrado en ${brand.name}.`,
      );
      return { data: null };
    }
    const detailRes = await this.api.get<{ data: ModelDetail }>(
      `/models/${brandModel.id}`,
    );
    return { data: detailRes.data };
  }
}
