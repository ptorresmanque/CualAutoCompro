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

interface Summary {
  brands: number;
  models: number;
  versions: number;
  equipment: number;
  maintenance: number;
  dealers: number;
  fuelPrices: number;
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
    try {
      const res = await this.api.get<{ data: Summary }>('/admin/summary');
      const counts = [res.data.brands, res.data.models, res.data.versions, res.data.equipment, res.data.maintenance, res.data.dealers, res.data.fuelPrices];
      this.cards.update((cards) => cards.map((card, index) => ({ ...card, count: counts[index] ?? 0, loading: false })));
    } catch {
      this.cards.update((cards) => cards.map((card) => ({ ...card, count: null, loading: false })));
    }
  }
}
