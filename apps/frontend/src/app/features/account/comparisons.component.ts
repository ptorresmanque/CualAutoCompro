import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DisclaimerComponent } from '../../shared/ui/disclaimer.component';

interface ComparisonVersion {
  id: string;
  name: string;
  priceClp?: number | null;
  model: { name: string; brand: { name: string } };
}

interface ComparisonItem {
  position: number;
  version: ComparisonVersion;
}

interface Comparison {
  id: string;
  slug: string | null;
  name: string | null;
  createdAt: string;
  items: ComparisonItem[];
}

@Component({
  selector: 'app-comparisons',
  templateUrl: './comparisons.component.html',
  styleUrl: './comparisons.component.css',
  imports: [RouterLink, DisclaimerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonsComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly user = this.auth.currentUser;

  comparisons = signal<Comparison[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  copiedId = signal<string | null>(null);

  readonly hasItems = computed(() => this.comparisons().length > 0);

  readonly initialLoad: Promise<void>;

  constructor() {
    this.initialLoad = this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.get<{ data: Comparison[] }>('/me/comparisons');
      this.comparisons.set(res.data);
    } catch {
      this.error.set('No se pudieron cargar tus comparaciones.');
    } finally {
      this.loading.set(false);
    }
  }

  displayName(c: Comparison): string {
    return c.name?.trim() || 'Comparación sin título';
  }

  shareUrl(slug: string | null): string {
    if (!slug) return '';
    if (typeof window === 'undefined') return `/c/${slug}`;
    return `${window.location.origin}/c/${slug}`;
  }

  async copyUrl(c: Comparison): Promise<void> {
    const url = this.shareUrl(c.slug);
    if (!url) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.copiedId.set(c.id);
      setTimeout(() => {
        if (this.copiedId() === c.id) this.copiedId.set(null);
      }, 2000);
    } catch {
      this.error.set('No se pudo copiar el enlace.');
    }
  }

  async deleteComparison(c: Comparison): Promise<void> {
    this.deletingId.set(c.id);
    try {
      await this.api.delete(`/me/comparisons/${c.id}`);
      this.comparisons.update((list) => list.filter((x) => x.id !== c.id));
    } catch {
      this.error.set('No se pudo eliminar la comparación.');
    } finally {
      this.deletingId.set(null);
    }
  }

  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `$${new Intl.NumberFormat('es-CL').format(value)}`;
  }

  fullName(v: ComparisonVersion): string {
    const brand = v.model?.brand?.name ?? '';
    const model = v.model?.name ?? '';
    return [brand, model, v.name].filter(Boolean).join(' ');
  }
}