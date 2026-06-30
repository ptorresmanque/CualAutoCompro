import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CompareStore } from '../../core/compare-store.service';
import { DisclaimerComponent } from '../../shared/ui/disclaimer.component';

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
  airbagCount?: number | null;
  hasAbs?: boolean;
  hasEsp?: boolean;
  hasCruiseControl?: boolean;
  equipmentItems?: { equipmentItem: { name: string; category: string } }[];
}

interface ModelDetail {
  id: string;
  name: string;
  segment: string;
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

type TabKey = 'specs' | 'equipment';

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrl: './model.component.css',
  imports: [RouterLink, DisclaimerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelComponent {
  private api = inject(ApiService);
  private compare = inject(CompareStore);
  private route = inject(ActivatedRoute);

  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  loading = signal(false);
  error = signal<string | null>(null);
  brand = signal<Brand | null>(null);
  model = signal<ModelDetail | null>(null);

  readonly versions = computed<ModelVersion[]>(() => this.model()?.versions ?? []);
  readonly galleryUrls = computed<string[]>(() => this.model()?.galleryUrls ?? []);
  readonly hasGallery = computed(() => this.galleryUrls().length > 0);
  readonly tab = signal<TabKey>('specs');

  readonly selectedIds = this.compare.ids;
  readonly maxSelected = computed(() => this.selectedIds().length >= 3);

  readonly currentIndex = signal(0);
  readonly currentUrl = computed(
    () => this.galleryUrls()[this.currentIndex()] ?? '',
  );
  private readonly _hovered = signal(false);
  readonly hovered = this._hovered.asReadonly();

  readonly segmentLabel = computed(() => {
    const seg = this.model()?.segment;
    const map: Record<string, string> = {
      SEDAN: 'Sedán',
      SUV: 'SUV',
      HATCHBACK: 'Hatchback',
      PICKUP: 'Pickup',
      CROSSOVER: 'Crossover',
      COMMERCIAL: 'Comercial',
    };
    return (seg && map[seg]) ?? seg ?? '';
  });

  readonly specGroups = computed<SpecGroup[]>(() => {
    const v = this.versions()[0];
    if (!v) return [];
    return [
      {
        title: 'Motorización',
        icon: 'settings_suggest',
        rows: [
          { label: 'Desplazamiento', value: v.engineDisplacementCc ? `${(v.engineDisplacementCc / 1000).toFixed(1)} L` : '—', zebra: false },
          { label: 'Potencia', value: v.powerHp ? `${v.powerHp} HP` : '—', zebra: true },
          { label: 'Torque', value: v.torqueNm ? `${v.torqueNm} Nm` : '—', zebra: false },
          { label: 'Combustible', value: v.fuel ?? '—', zebra: true },
          { label: 'Transmisión', value: v.transmission ?? '—', zebra: false },
          {
            label: 'Consumo ciudad / carretera',
            value: v.consumptionCityKmL && v.consumptionHighwayKmL
              ? `${v.consumptionCityKmL} / ${v.consumptionHighwayKmL} km/l`
              : '—',
            zebra: true,
          },
        ].filter((r) => r.value !== '—' || true),
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
      {
        title: 'Seguridad',
        icon: 'verified_user',
        rows: [
          {
            label: 'Airbags',
            value: v.airbagCount ? `${v.airbagCount} airbags` : '—',
            zebra: false,
          },
          { label: 'Frenos ABS + EBD', value: v.hasAbs ? 'Sí' : 'No', zebra: true },
          { label: 'Control estabilidad (ESP)', value: v.hasEsp ? 'Sí' : 'No', zebra: false },
          {
            label: 'Control de crucero',
            value: v.hasCruiseControl ? 'Sí' : 'No',
            zebra: true,
          },
        ],
      },
    ];
  });

  readonly equipmentNames = computed<string[]>(() => {
    const all = this.versions().flatMap((v) =>
      (v.equipmentItems ?? []).map((ei) => ei.equipmentItem.name),
    );
    return [...new Set(all)].sort((a, b) => a.localeCompare(b));
  });

  readonly initialLoad: Promise<void>;

  constructor() {
    this.initialLoad = this.bootstrap();
  }

  setTab(t: TabKey): void {
    this.tab.set(t);
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
    else this.compare.add(id);
  }

  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `$${new Intl.NumberFormat('es-CL').format(value)}`;
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
      const brandsRes = await this.api.get<{ data: Brand[] }>('/brands');
      const brand = brandsRes.data.find(
        (b) => b.name.toLowerCase() === brandSlug.toLowerCase(),
      );
      if (!brand) {
        this.error.set(`Marca "${brandSlug}" no encontrada.`);
        return;
      }
      this.brand.set(brand);

      const modelsRes = await this.api.get<{ data: BrandModel[] }>(
        `/brands/${brand.id}/models`,
      );
      const brandModel = modelsRes.data.find(
        (m) => m.name.toLowerCase() === modelSlug.toLowerCase(),
      );
      if (!brandModel) {
        this.error.set(
          `Modelo "${modelSlug}" no encontrado en ${brand.name}.`,
        );
        return;
      }

      const detailRes = await this.api.get<{ data: ModelDetail }>(
        `/models/${brandModel.id}`,
      );
      this.model.set(detailRes.data);
    } catch {
      this.error.set('No se pudo cargar el modelo.');
    } finally {
      this.loading.set(false);
    }
  }
}
