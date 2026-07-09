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
  private compare = inject(CompareStore);
  readonly favorites = inject(FavoritesStore);

  readonly featured = signal<VehicleCardInput[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly stats = signal<Stats | null>(null);
  readonly selectedVersions = signal<Record<string, string>>({});
  readonly selectedIds = this.compare.ids;
  readonly maxReached = computed(() => this.selectedIds().length >= 3);

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
