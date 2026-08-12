import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CompareStore } from '../../core/compare-store.service';
import { PopularityService } from '../../core/popularity.service';
import { FavoritesStore } from '../../core/favorites-store.service';
import { toAbsoluteUploadUrl } from '../../core/upload-url';
import {
  VehicleCardComponent,
  VehicleCardInput,
} from '../../shared/ui/vehicle-card.component';
import { VehicleVersion } from '../../core/types/vehicle';
import {
  fuelLabel,
  segmentLabel,
  transmissionLabel,
} from '../../core/types/catalog-labels';

interface Stats {
  total: number;
  brands: number;
  versions: number;
}

interface LiveComparisonEntry {
  model: VehicleCardInput;
  version: VehicleVersion;
}

/** Cada cuánto avanza el carrusel del hero. */
const ROTATION_MS = 7000;

/** Tope de parejas: más allá de esto la fila de dots deja de ser navegable. */
const MAX_PAIRS = 6;

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
  private popularity = inject(PopularityService);
  readonly favorites = inject(FavoritesStore);
  readonly user = this.auth.currentUser;

  private readonly allItems = signal<VehicleCardInput[]>([]);
  readonly featured = computed<VehicleCardInput[]>(() => {
    const top = this.popularity.topIds();
    if (top.size === 0) return [];
    return this.allItems().filter((i) => top.has(i.id));
  });
  /** Parejas del hero: dos modelos del mismo segmento por slide. */
  readonly pairs = signal<LiveComparisonEntry[][]>([]);
  readonly activePairIndex = signal(0);
  /** La pareja en pantalla. */
  readonly liveComparison = computed(
    () => this.pairs()[this.activePairIndex()] ?? [],
  );
  /** Con el puntero encima o el foco adentro el carrusel no avanza. */
  private readonly paused = signal(false);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly stats = signal<Stats | null>(null);
  readonly selectedVersions = signal<Record<string, string>>({});
  readonly selectedIds = this.compare.ids;
  readonly maxReached = computed(() => this.selectedIds().length >= 3);

  pairIds(pair: LiveComparisonEntry[]): string {
    return pair.map((item) => item.version.id).join(',');
  }

  pairPriceDifference(pair: LiveComparisonEntry[]): number {
    if (pair.length < 2) return 0;
    return Math.abs(pair[1].version.priceClp - pair[0].version.priceClp);
  }

  /**
   * Segmento de la pareja. Es el dato que justifica la comparación: sin él
   * la cabecera decía "2 modelos", que ya se ve en la grilla.
   */
  segmentLabelFor(pair: LiveComparisonEntry[]): string {
    const first = pair[0];
    if (!first) return '';
    const a = first.model.segment;
    const b = pair[1]?.model.segment;
    return a === b ? segmentLabel(a) : 'Comparación';
  }

  /** `background-image` del thumb; `none` si el modelo no tiene imagen. */
  modelImage(model: VehicleCardInput): string {
    const url = toAbsoluteUploadUrl(model.imageUrl);
    return url ? `url("${url}")` : 'none';
  }

  goToPair(index: number): void {
    if (index < 0 || index >= this.pairs().length) return;
    this.activePairIndex.set(index);
  }

  setPaused(value: boolean): void {
    this.paused.set(value);
  }

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
      this.popularity.recordAdd(version.id);
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
    if (version.fuel) details.push(fuelLabel(version.fuel));
    if (version.powerHp) details.push(`${version.powerHp} HP`);
    return details.join(' · ') || 'Motor por confirmar';
  }

  drivingLabel(version: VehicleVersion): string {
    const details: string[] = [];
    if (version.transmission) details.push(transmissionLabel(version.transmission));
    if (version.consumptionCityKmL) {
      details.push(`${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(version.consumptionCityKmL)} km/l ciudad`);
    }
    return details.join(' · ') || 'Consumo por confirmar';
  }

  readonly ready: Promise<void>;

  constructor() {
    this.startRotation();
    this.ready = this.bootstrap();
  }

  /**
   * Avance automático del carrusel del hero.
   *
   * No arranca con `prefers-reduced-motion`: ahí el slide ya está desactivado
   * por CSS y rotar igual dejaría el contenido cambiando de golpe solo, que es
   * exactamente lo que la preferencia pide evitar. Los dots siguen sirviendo.
   */
  private startRotation(): void {
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const timer = setInterval(() => {
      if (this.paused()) return;
      const total = this.pairs().length;
      if (total > 1) this.activePairIndex.update((i) => (i + 1) % total);
    }, ROTATION_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /**
   * Parejas comparables: dos modelos **del mismo segmento** y de precio
   * cercano. Comparar un SUV con un city car no le sirve a nadie, así que se
   * agrupa por segmento, se ordena por precio y se enfrentan los consecutivos.
   *
   * Determinista a propósito (sin `random`): el orden depende solo del
   * catálogo, así que los tests son estables y quien vuelve a la home ve lo
   * mismo que la vez anterior.
   */
  private buildPairs(items: VehicleCardInput[]): LiveComparisonEntry[][] {
    const entries = items
      .map((model) => ({
        model,
        version: model.versions[0] ?? model.defaultVersion ?? null,
      }))
      .filter((item): item is LiveComparisonEntry => item.version !== null);

    const bySegment = new Map<string, LiveComparisonEntry[]>();
    for (const entry of entries) {
      const list = bySegment.get(entry.model.segment) ?? [];
      list.push(entry);
      bySegment.set(entry.model.segment, list);
    }

    const pairs: LiveComparisonEntry[][] = [];
    for (const list of bySegment.values()) {
      const byPrice = [...list].sort(
        (a, b) => a.version.priceClp - b.version.priceClp,
      );
      for (let i = 0; i + 1 < byPrice.length; i += 2) {
        pairs.push([byPrice[i], byPrice[i + 1]]);
      }
    }

    // Catálogo chico: si ningún segmento llega a dos modelos no habría ninguna
    // pareja y el hero quedaría vacío. Ahí vale más una comparación cruzada
    // que un hueco.
    if (pairs.length === 0 && entries.length >= 2) {
      pairs.push([entries[0], entries[1]]);
    }
    return pairs.slice(0, MAX_PAIRS);
  }

  private async bootstrap(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.get<{
        data: { items: VehicleCardInput[]; total: number };
      }>('/models', { page: 1, pageSize: 30 });
      const items = res.data.items;
      this.pairs.set(this.buildPairs(items));
      this.allItems.set(items);
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
