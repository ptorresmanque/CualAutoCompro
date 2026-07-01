import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CompareStore } from '../../core/compare-store.service';
import { FavoritesStore } from '../../core/favorites-store.service';
import {
  VehicleCardComponent,
  VehicleCardInput,
} from '../../shared/ui/vehicle-card.component';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
  imports: [RouterLink, VehicleCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesComponent {
  private api = inject(ApiService);
  private compare = inject(CompareStore);
  private favorites = inject(FavoritesStore);
  private router = inject(Router);

  readonly models = signal<VehicleCardInput[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly compareMessage = signal<string | null>(null);

  readonly hasItems = computed(() => this.models().length > 0);
  readonly compareCount = computed(() => Math.min(this.models().length, 3));

  readonly initialLoad: Promise<void>;

  constructor() {
    this.initialLoad = this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.get<{ data: VehicleCardInput[] }>(
        '/me/favorites/models',
      );
      this.models.set(res.data ?? []);
    } catch {
      this.error.set('No pudimos cargar tus favoritos.');
    } finally {
      this.loading.set(false);
    }
  }

  isAdded(m: VehicleCardInput): boolean {
    const id = m.defaultVersion?.id;
    return id ? this.compare.ids().includes(id) : false;
  }

  selectedVersionId(m: VehicleCardInput): string | null {
    return m.defaultVersion?.id ?? m.versions[0]?.id ?? null;
  }

  async compareOne(m: VehicleCardInput): Promise<void> {
    if (this.compare.ids().length >= 3) {
      this.compareMessage.set(
        'Máximo 3, limpiá la comparación actual primero.',
      );
      return;
    }
    const vid = this.selectedVersionId(m);
    if (!vid) return;
    this.compare.setIds([...this.compare.ids(), vid]);
    this.compareMessage.set(null);
    await this.router.navigate(['/compare']);
  }

  async compareAllMine(): Promise<void> {
    const ids = this.models()
      .slice(0, 3)
      .map((m) => this.selectedVersionId(m))
      .filter((id): id is string => id != null);
    if (ids.length === 0) return;
    this.compare.setIds(ids);
    await this.router.navigate(['/compare']);
  }

  trackById(_: number, m: VehicleCardInput): string {
    return m.id;
  }
}