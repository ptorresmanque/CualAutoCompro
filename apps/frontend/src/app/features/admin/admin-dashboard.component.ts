import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/api.service';

interface Card {
  path: string;
  label: string;
  count: number | null;
  loading: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, MatCardModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private api = inject(ApiService);

  readonly cards = signal<Card[]>([
    { path: '/admin/brands',      label: 'Marcas',              count: null, loading: true },
    { path: '/admin/models',      label: 'Modelos',             count: null, loading: true },
    { path: '/admin/versions',    label: 'Versiones',           count: null, loading: true },
    { path: '/admin/equipment',   label: 'Equipamiento',        count: null, loading: true },
    { path: '/admin/maintenance', label: 'Mantención',          count: null, loading: true },
    { path: '/admin/dealers',     label: 'Concesionarios',      count: null, loading: true },
    { path: '/admin/fuel-prices', label: 'Precios combustible', count: null, loading: true },
  ]);

  constructor() {
    void this.loadCounts();
  }

  private async loadCounts(): Promise<void> {
    await Promise.all([
      this.load('/brands',                       0),
      this.load('/models?pageSize=1',            1),
      this.load('/versions?pageSize=1',          2),
      this.load('/equipment',                    3),
      this.load('/admin/maintenance',            4),
      this.load('/admin/dealers',                5),
      this.load('/admin/fuel-prices',            6),
    ]);
  }

  private async load(path: string, idx: number): Promise<void> {
    try {
      const res = await this.api.get<{ data: unknown } | { data: { total?: number; items?: unknown[] } }>(path);
      const data = (res as { data: unknown }).data;
      let count = 0;
      if (Array.isArray(data)) count = data.length;
      else if (data && typeof data === 'object') {
        const d = data as { total?: number; items?: unknown[] };
        count = d.total ?? d.items?.length ?? 0;
      }
      this.cards.update((cs) => cs.map((c, i) => (i === idx ? { ...c, count, loading: false } : c)));
    } catch {
      this.cards.update((cs) => cs.map((c, i) => (i === idx ? { ...c, count: null, loading: false } : c)));
    }
  }
}
