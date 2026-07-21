import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { ApiCallError } from '../../core/api-error';

interface CostBreakdown {
  kmPerYear: number;
  fuelClp: number;
  maintenanceClp: number;
  circulationPermitClp: number;
  mandatoryInsuranceClp: number;
  voluntaryInsuranceClp: number;
  depreciationClp: number;
  totalClp: number;
  meta: {
    consumptionCityKmL: number | null;
    consumptionHighwayKmL: number | null;
    fuelType: string | null;
    fuelUnit: string | null;
    fuelPricePerUnit: number | null;
    cityShare: number;
    highwayShare: number;
    maintenanceMileages: number[];
  };
}

const formatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});
const fmt = (n: number) => formatter.format(n);

interface Row {
  label: string;
  value: number;
  icon: string;
  hint?: string;
}

@Component({
  selector: 'app-annual-cost-card',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="annual-cost-card" aria-label="Costo anual estimado">
      <header class="flex items-center justify-between gap-3">
        <h3 class="text-base font-bold">Costo anual estimado</h3>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="km-field">
          <mat-label>km/año</mat-label>
          <input
            matInput
            type="number"
            inputmode="numeric"
            min="0"
            max="200000"
            step="1000"
            [ngModel]="km()"
            (ngModelChange)="onKmChange($event)"
            aria-label="Kilómetros por año"
          />
        </mat-form-field>
      </header>

      @if (loading()) {
        <p class="text-sm text-ink-muted">Calculando…</p>
      } @else if (error()) {
        <p class="text-sm text-warn-dark">{{ error() }}</p>
      } @else if (cost(); as c) {
        <p class="annual-cost-total">{{ fmt(c.totalClp) }} <span class="text-sm text-ink-muted">/ año</span></p>
        <ul class="annual-cost-rows">
          @for (row of rows(); track row.label) {
            <li>
              <mat-icon class="row-icon">{{ row.icon }}</mat-icon>
              <span class="row-label">
                {{ row.label }}
                @if (row.hint) {
                  <small class="row-hint">{{ row.hint }}</small>
                }
              </span>
              <span class="row-value">{{ fmt(row.value) }}</span>
            </li>
          }
        </ul>
        <p class="annual-cost-meta">
          Considera {{ percent(c.meta.cityShare) }}% ciudad /
          {{ percent(c.meta.highwayShare) }}% carretera.
          @if (c.meta.fuelPricePerUnit !== null && c.meta.fuelUnit) {
            Precio combustible: {{ fmt(c.meta.fuelPricePerUnit) }}/{{ c.meta.fuelUnit }}.
          }
        </p>
      }
    </article>
  `,
  styles: [
    `
      .annual-cost-card {
        border: 1px solid var(--c-border, #cbd5e1);
        border-radius: 12px;
        padding: 1rem;
        background: var(--c-surface, #fff);
      }
      .km-field { width: 110px; }
      .annual-cost-total {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0.5rem 0 0.75rem;
      }
      .annual-cost-rows { list-style: none; padding: 0; margin: 0 0 0.5rem; }
      .annual-cost-rows li {
        display: grid;
        grid-template-columns: 24px 1fr auto;
        gap: 0.5rem;
        align-items: center;
        padding: 0.25rem 0;
        font-size: 0.875rem;
      }
      .row-icon { font-size: 18px; height: 18px; width: 18px; color: var(--c-ink-muted, #475569); }
      .row-hint { display: block; color: var(--c-ink-muted, #475569); font-size: 0.75rem; }
      .annual-cost-meta {
        font-size: 0.75rem;
        color: var(--c-ink-muted, #475569);
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class AnnualCostCardComponent {
  private api = inject(ApiService);

  readonly versionId = input.required<string>();
  readonly initialKm = input<number>(15_000);

  readonly km = signal<number>(15_000);
  readonly cost = signal<CostBreakdown | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly rows = computed<Row[]>(() => {
    const c = this.cost();
    if (!c) return [];
    return [
      { label: 'Combustible', value: c.fuelClp, icon: 'local_gas_station', hint: `${c.kmPerYear.toLocaleString('es-CL')} km/año` },
      { label: 'Mantención', value: c.maintenanceClp, icon: 'build', hint: `${c.meta.maintenanceMileages.length} hito(s)` },
      { label: 'Permiso de circulación', value: c.circulationPermitClp, icon: 'description' },
      { label: 'Seguro obligatorio', value: c.mandatoryInsuranceClp, icon: 'verified_user' },
      { label: 'Seguro voluntario', value: c.voluntaryInsuranceClp, icon: 'shield' },
      { label: 'Depreciación (~10%)', value: c.depreciationClp, icon: 'trending_down' },
    ];
  });

  constructor() {
    effect(() => {
      const vid = this.versionId();
      if (!vid) return;
      // Reset km when version changes
      const initial = this.initialKm();
      if (this.km() === 0) this.km.set(initial);
      void this.fetch(vid, this.km());
    });
  }

  fmt = fmt;

  percent(value: number): number {
    return Math.round(value * 100);
  }

  onKmChange(value: number | string): void {
    const n = typeof value === 'string' ? Number.parseInt(value, 10) : value;
    if (Number.isFinite(n)) {
      this.km.set(Math.max(0, Math.min(200_000, n)));
      void this.fetch(this.versionId(), this.km());
    }
  }

  private async fetch(versionId: string, km: number): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.api.get<{ data: CostBreakdown }>(
        `/cost/version/${encodeURIComponent(versionId)}`,
        { kmPerYear: km },
      );
      this.cost.set(data.data);
      this.error.set(null);
    } catch (e) {
      this.cost.set(null);
      if (e instanceof ApiCallError) {
        this.error.set(e.backend.message);
      } else {
        this.error.set((e as Error).message);
      }
    } finally {
      this.loading.set(false);
    }
  }
}
