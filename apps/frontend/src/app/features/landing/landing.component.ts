import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CompareStore } from '../../core/compare-store.service';
import { FavoritesStore } from '../../core/favorites-store.service';
import {
  VehicleCardComponent,
  VehicleCardInput,
} from '../../shared/ui/vehicle-card.component';
import { VehicleVersion } from '../../core/types/vehicle';

interface Stats {
  total: number;
  brands: number;
  versions: number;
}

interface LiveComparisonEntry {
  model: VehicleCardInput;
  version: VehicleVersion;
}

const FEATURED_ON_LANDING = new Set(['Corolla', 'Tucson', 'CX-5']);

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  imports: [RouterLink, VehicleCardComponent, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private compare = inject(CompareStore);
  readonly favorites = inject(FavoritesStore);
  readonly user = this.auth.currentUser;

  readonly featured = signal<VehicleCardInput[]>([]);
  readonly liveComparison = signal<LiveComparisonEntry[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly stats = signal<Stats | null>(null);
  readonly selectedVersions = signal<Record<string, string>>({});
  readonly selectedIds = this.compare.ids;
  readonly maxReached = computed(() => this.selectedIds().length >= 3);
  readonly liveComparisonIds = computed(() =>
    this.liveComparison().map((item) => item.version.id).join(','),
  );
  readonly priceDifference = computed(() => {
    const entries = this.liveComparison();
    if (entries.length < 2) return null;
    return Math.abs(entries[1].version.priceClp - entries[0].version.priceClp);
  });

  selectedVersionId(item: VehicleCardInput): string | null {
    const override = this.selectedVersions()[item.id];
    if (override) return override;
    return item.versions[0]?.id ?? item.defaultVersion?.id ?? null;
  }

  isAdded(item: VehicleCardInput): boolean {
    const id = this.selectedVersionId(item);
    return id ? this.selectedIds().includes(id) : false;
  }

  addToCompare(version: VehicleVersion): void {
    if (this.selectedIds().includes(version.id)) {
      this.compare.remove(version.id);
    } else {
      this.compare.add(version.id);
    }
  }

  onVersionSelected(item: VehicleCardInput, v: VehicleVersion): void {
    this.selectedVersions.update((m) => ({ ...m, [item.id]: v.id }));
  }

  onFavoriteToggle(m: VehicleCardInput, v: VehicleVersion): void {
    void this.favorites.toggle({ modelId: m.id, versionId: v.id });
  }

  formatClp(value: number): string {
    return `$ ${new Intl.NumberFormat('es-CL').format(value)}`;
  }

  engineLabel(version: VehicleVersion): string {
    const details: string[] = [];
    if (version.engineDisplacementCc) {
      details.push(`${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(version.engineDisplacementCc / 1000)} L`);
    }
    if (version.fuel) details.push(this.fuelLabel(version.fuel));
    if (version.powerHp) details.push(`${version.powerHp} HP`);
    return details.join(' · ') || 'Motor por confirmar';
  }

  drivingLabel(version: VehicleVersion): string {
    const details: string[] = [];
    if (version.transmission) details.push(this.transmissionLabel(version.transmission));
    if (version.consumptionCityKmL) {
      details.push(`${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(version.consumptionCityKmL)} km/l ciudad`);
    }
    return details.join(' · ') || 'Consumo por confirmar';
  }

  private fuelLabel(fuel: string): string {
    const labels: Record<string, string> = {
      BENCINA: 'Bencina',
      DIESEL: 'Diésel',
      HYBRID: 'Híbrido',
      ELECTRIC: 'Eléctrico',
    };
    return labels[fuel] ?? fuel;
  }

  private transmissionLabel(transmission: string): string {
    const labels: Record<string, string> = {
      MANUAL: 'Manual',
      AUTOMATIC: 'Automática',
      CVT: 'CVT',
      DCT: 'DCT',
    };
    return labels[transmission] ?? transmission;
  }

  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.get<{
        data: { items: VehicleCardInput[]; total: number };
      }>('/models', { page: 1, pageSize: 30 });
      const items = res.data.items;
      this.liveComparison.set(
        items
          .map((model) => ({
            model,
            version: model.defaultVersion ?? model.versions[0] ?? null,
          }))
          .filter((item): item is LiveComparisonEntry => item.version !== null)
          .slice(0, 2),
      );
      this.featured.set(items.filter((i) => FEATURED_ON_LANDING.has(i.name)));
      const brandSet = new Set(items.map((i) => i.brand.name));
      const versions = items.reduce((acc, i) => acc + (i.versions?.length ?? 0), 0);
      this.stats.set({
        total: res.data.total,
        brands: brandSet.size,
        versions,
      });
    } catch {
      this.loadError.set('No pudimos cargar los datos destacados.');
    } finally {
      this.loading.set(false);
    }
  }
}
