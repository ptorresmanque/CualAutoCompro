import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CompareStore } from '../../core/compare-store.service';
import { DisclaimerComponent } from '../../shared/ui/disclaimer.component';

interface ModelLite {
  name: string;
  brand: { name: string };
}

export interface CompareVersion {
  id: string;
  name: string;
  priceClp?: number | null;
  year?: number | null;
  transmission?: string | null;
  fuel?: string | null;
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
  airbagCount?: number | null;
  hasAbs?: boolean | null;
  hasEsp?: boolean | null;
  hasCruiseControl?: boolean | null;
  model?: ModelLite;
}

type DiffKey =
  | 'priceClp'
  | 'year'
  | 'transmission'
  | 'fuel'
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
  | 'airbagCount'
  | 'hasAbs'
  | 'hasEsp'
  | 'hasCruiseControl';

interface SectionRow {
  key: DiffKey;
  label: string;
  format: (v: CompareVersion) => string;
}

interface Section {
  name: string;
  label: string;
  rows: SectionRow[];
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
  imports: [DisclaimerComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private compareStore = inject(CompareStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly user = this.auth.currentUser;

  versions = signal<CompareVersion[]>([]);
  diffHighlights = signal<Partial<Record<DiffKey, boolean>>>({});
  loading = signal(false);
  saving = signal(false);
  savedSlug = signal<string | null>(null);
  sharedMeta = signal<{ slug: string; createdAt: string; userId: string } | null>(null);
  loadError = signal<string | null>(null);

  readonly count = computed(() => this.versions().length);

  readonly empty = computed(() => {
    this.versions();
    return (
      this.compareStore.ids().length === 0 &&
      this.versions().length === 0 &&
      this.sharedMeta() === null &&
      this.loadError() === null
    );
  });

  readonly ready: Promise<void>;

  readonly sections: ReadonlyArray<Section> = [
    {
      name: 'specs',
      label: 'Especificaciones',
      rows: [
        {
          key: 'engineDisplacementCc',
          label: 'Cilindrada',
          format: (v) => (v.engineDisplacementCc ? `${v.engineDisplacementCc} cc` : '—'),
        },
        {
          key: 'powerHp',
          label: 'Potencia',
          format: (v) => (v.powerHp ? `${v.powerHp} hp` : '—'),
        },
        {
          key: 'torqueNm',
          label: 'Torque',
          format: (v) => (v.torqueNm ? `${v.torqueNm} Nm` : '—'),
        },
        {
          key: 'consumptionCityKmL',
          label: 'Consumo ciudad',
          format: (v) => (v.consumptionCityKmL ? `${v.consumptionCityKmL} km/L` : '—'),
        },
        {
          key: 'consumptionHighwayKmL',
          label: 'Consumo carretera',
          format: (v) => (v.consumptionHighwayKmL ? `${v.consumptionHighwayKmL} km/L` : '—'),
        },
        {
          key: 'transmission',
          label: 'Transmisión',
          format: (v) => v.transmission ?? '—',
        },
        {
          key: 'fuel',
          label: 'Combustible',
          format: (v) => v.fuel ?? '—',
        },
        {
          key: 'lengthMm',
          label: 'Largo',
          format: (v) => (v.lengthMm ? `${v.lengthMm} mm` : '—'),
        },
        {
          key: 'widthMm',
          label: 'Ancho',
          format: (v) => (v.widthMm ? `${v.widthMm} mm` : '—'),
        },
        {
          key: 'heightMm',
          label: 'Alto',
          format: (v) => (v.heightMm ? `${v.heightMm} mm` : '—'),
        },
        {
          key: 'weightKg',
          label: 'Peso',
          format: (v) => (v.weightKg ? `${v.weightKg} kg` : '—'),
        },
        {
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
          key: 'priceClp',
          label: 'Precio (CLP)',
          format: (v) => (v.priceClp ? this.formatPrice(v.priceClp) : '—'),
        },
        {
          key: 'year',
          label: 'Año',
          format: (v) => (v.year ? String(v.year) : '—'),
        },
      ],
    },
    {
      name: 'equipamiento',
      label: 'Equipamiento',
      rows: [
        {
          key: 'airbagCount',
          label: 'Airbags',
          format: (v) => (v.airbagCount ? String(v.airbagCount) : '—'),
        },
        {
          key: 'hasAbs',
          label: 'ABS',
          format: (v) => (v.hasAbs ? 'Sí' : 'No'),
        },
        {
          key: 'hasEsp',
          label: 'Control de estabilidad',
          format: (v) => (v.hasEsp ? 'Sí' : 'No'),
        },
        {
          key: 'hasCruiseControl',
          label: 'Control de crucero',
          format: (v) => (v.hasCruiseControl ? 'Sí' : 'No'),
        },
      ],
    },
    {
      name: 'mantencion',
      label: 'Mantención',
      rows: [
        {
          key: 'priceClp',
          label: 'Costo referencial',
          format: (v) => (v.priceClp ? this.formatPrice(Math.round(v.priceClp * 0.04)) : '—'),
        },
      ],
    },
  ];

  constructor() {
    this.ready = this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    const qp = this.route.snapshot.queryParamMap;
    const slug = qp.get('slug');
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
    return this.isDiff(key)
      ? 'bg-amber-50 ring-1 ring-amber-200'
      : '';
  }

  sectionIcon(name: string): string {
    switch (name) {
      case 'specs':
        return 'analytics';
      case 'precio-anio':
        return 'payments';
      case 'equipamiento':
        return 'inventory_2';
      case 'mantencion':
        return 'build';
      default:
        return 'analytics';
    }
  }

  trackById(_: number, v: CompareVersion): string {
    return v.id;
  }

  trackByRow(_: number, row: SectionRow): string {
    return row.key;
  }

  trackBySection(_: number, s: Section): string {
    return s.name;
  }

  removeFromCompare(id: string): void {
    this.compareStore.remove(id);
    this.versions.update((vs) => vs.filter((v) => v.id !== id));
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
    try {
      const res = await this.api.post<{
        data: { slug: string };
      }>('/me/comparisons', { versionIds: ids });
      this.savedSlug.set(res.data.slug);
    } finally {
      this.saving.set(false);
    }
  }
}
