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

interface ModelDetail {
  id: string;
  name: string;
  segment: string;
  brand: { name: string };
  versions: ModelVersion[];
  galleryUrls?: string[];
}

interface ModelVersion {
  id: string;
  name: string;
  priceClp: number | null;
  year: number | null;
  fuel?: string | null;
  transmission?: string | null;
  powerHp?: number | null;
}

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

  readonly selectedIds = this.compare.ids;
  readonly maxSelected = computed(() => this.selectedIds().length >= 3);

  readonly currentIndex = signal(0);
  readonly currentUrl = computed(
    () => this.galleryUrls()[this.currentIndex()] ?? '',
  );

  readonly initialLoad: Promise<void>;

  constructor() {
    this.initialLoad = this.bootstrap();
  }

  @HostListener('window:keydown', ['$event'])
  onKey(ev: KeyboardEvent) {
    if (!this.hasGallery() || ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (ev.key === 'ArrowLeft') {
      this.prev();
    } else if (ev.key === 'ArrowRight') {
      this.next();
    }
  }

  prev(): void {
    const n = this.galleryUrls().length;
    if (n === 0) return;
    this.currentIndex.update((i) => (i - 1 + n) % n);
  }

  next(): void {
    const n = this.galleryUrls().length;
    if (n === 0) return;
    this.currentIndex.update((i) => (i + 1) % n);
  }

  goTo(i: number): void {
    const n = this.galleryUrls().length;
    if (i < 0 || i >= n) return;
    this.currentIndex.set(i);
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
      const brandModel = modelsRes.data.find((m) => m.name === modelSlug);
      if (!brandModel) {
        this.error.set(`Modelo "${modelSlug}" no encontrado en ${brand.name}.`);
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

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleVersion(id: string): void {
    if (this.isSelected(id)) {
      this.compare.remove(id);
    } else {
      this.compare.add(id);
    }
  }

  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `$${new Intl.NumberFormat('es-CL').format(value)}`;
  }
}
