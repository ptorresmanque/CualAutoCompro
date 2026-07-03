import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { CompareStore } from '../../core/compare-store.service';
import { FavoritesStore } from '../../core/favorites-store.service';
import {
  VehicleCardComponent,
  VehicleCardInput,
} from '../../shared/ui/vehicle-card.component';
import { VehicleVersion } from '../../core/types/vehicle';

interface FavoriteModel extends VehicleCardInput {
  versionId: string;
}

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
  imports: [RouterLink, VehicleCardComponent, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesComponent {
  private api = inject(ApiService);
  private compare = inject(CompareStore);
  private favorites = inject(FavoritesStore);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly models = signal<FavoriteModel[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly compareMessage = signal<string | null>(null);
  readonly changingVersionFor = signal<string | null>(null);

  readonly hasItems = computed(() => this.models().length > 0);
  readonly compareCount = computed(() => Math.min(this.models().length, 3));
  readonly maxReached = computed(() => this.compare.ids().length >= 3);

  readonly initialLoad: Promise<void>;

  constructor() {
    this.initialLoad = this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.get<{ data: FavoriteModel[] }>(
        '/me/favorites/models',
      );
      this.models.set(res.data ?? []);
    } catch {
      this.error.set('No pudimos cargar tus favoritos.');
    } finally {
      this.loading.set(false);
    }
  }

  isAdded(m: FavoriteModel): boolean {
    return this.compare.ids().includes(m.versionId);
  }

  async onRemove(m: FavoriteModel, _v: VehicleVersion): Promise<void> {
    await this.favorites.toggle({ modelId: m.id, versionId: m.versionId });
    this.models.update((arr) => arr.filter((x) => x.id !== m.id));
  }

  selectedVersionId(m: FavoriteModel): string {
    return m.versionId;
  }

  async onCompareTapped(m: FavoriteModel, v: VehicleVersion): Promise<void> {
    if (this.compare.ids().length >= 3) {
      this.compareMessage.set(
        'Máximo 3, limpiá la comparación actual primero.',
      );
      this.snackBar.open(
        'Máximo 3, limpiá la comparación actual primero.',
        'Cerrar',
        { duration: 5000, panelClass: 'snack-warn' },
      );
      return;
    }
    if (!v?.id) return;
    this.compare.setIds([...this.compare.ids(), v.id]);
    this.compareMessage.set(null);
    this.snackBar.open(
      `Versión ${v.name} agregada a la comparación`,
      'Ver',
      { duration: 4000 },
    ).onAction().subscribe(() => {
      void this.router.navigate(['/compare']);
    });
  }

  async onVersionSelected(
    m: FavoriteModel,
    v: VehicleVersion,
  ): Promise<void> {
    if (!v?.id || v.id === m.versionId) return;
    this.changingVersionFor.set(m.id);
    try {
      await this.favorites.changeVersion({
        currentVersionId: m.versionId,
        modelId: m.id,
        newVersionId: v.id,
      });
      this.models.update((arr) =>
        arr.map((x) => (x.id === m.id ? { ...x, versionId: v.id } : x)),
      );
    } catch {
      this.error.set('No pudimos cambiar la versión favorita.');
      this.snackBar.open(
        'No pudimos cambiar la versión favorita.',
        'Cerrar',
        { duration: 5000, panelClass: 'snack-error' },
      );
    } finally {
      this.changingVersionFor.set(null);
    }
  }

  async compareAllMine(): Promise<void> {
    const ids = this.models()
      .slice(0, 3)
      .map((m) => m.versionId)
      .filter((id) => id != null);
    if (ids.length === 0) return;
    this.compare.setIds(ids);
    await this.router.navigate(['/compare']);
  }

  trackById(_: number, m: FavoriteModel): string {
    return m.id;
  }
}
