import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {
  AnnualCostService,
  clampKmPerYear,
  DEFAULT_KM_PER_YEAR,
  MAX_KM_PER_YEAR,
  type CostBreakdown,
} from '../../core/annual-cost.service';

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
            [max]="maxKm"
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
        <p class="text-sm text-danger-dark">{{ error() }}</p>
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
      /* Radio 2px, no 12px: el sistema "Pizarra Digital" es rectangular
       * (ver apps/frontend/AGENTS.md §"Lo que NO se hace"). */
      .annual-cost-card {
        border: 1px solid var(--rule-strong);
        border-radius: 2px;
        padding: 1rem;
        background: var(--paper-cool);
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
      .row-icon { font-size: 18px; height: 18px; width: 18px; color: var(--ink-muted); }
      .row-hint { display: block; color: var(--ink-muted); font-size: 0.75rem; }
      .annual-cost-meta {
        font-size: 0.75rem;
        color: var(--ink-muted);
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class AnnualCostCardComponent {
  private costs = inject(AnnualCostService);

  readonly versionId = input.required<string>();
  readonly initialKm = input<number>(DEFAULT_KM_PER_YEAR);
  /** Espera antes de pedir el cálculo tras editar km/año. 0 en tests. */
  readonly debounceMs = input<number>(400);

  /** Editable por el usuario; vuelve a `initialKm` si el padre lo cambia. */
  readonly km = linkedSignal(() => this.initialKm());
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

  /** Versión para la que ya se disparó una carga: la primera no se debouncea. */
  private fetchedFor: string | null = null;

  constructor() {
    // Único punto de fetch: el effect depende de `versionId` y de `km`, así que
    // reacciona tanto al montaje como a cada cambio de km/año. `onKmChange` NO
    // debe llamar a `fetch` además de esto — hacerlo emitía dos requests
    // idénticos por cada tecla, y forzaba a leer `versionId()` (input
    // requerido) antes de que el padre lo hubiera bindeado.
    //
    // El timer + `onCleanup` es el debounce: cada re-ejecución del effect
    // cancela el fetch pendiente, así que escribir "25000" en el campo de
    // km/año dispara un request y no cinco (uno por tecla). La primera carga
    // de cada versión no espera, para no agregarle latencia a la ficha.
    effect((onCleanup) => {
      const vid = this.versionId();
      if (!vid) return;
      const km = this.km();
      const delay = this.fetchedFor === vid ? this.debounceMs() : 0;
      this.fetchedFor = vid;
      if (delay <= 0) {
        void this.fetch(vid, km);
        return;
      }
      const handle = setTimeout(() => void this.fetch(vid, km), delay);
      onCleanup(() => clearTimeout(handle));
    });
  }

  fmt = fmt;
  readonly maxKm = MAX_KM_PER_YEAR;

  percent(value: number): number {
    return Math.round(value * 100);
  }

  /** Solo normaliza el valor; el fetch lo dispara el effect del constructor. */
  onKmChange(value: number | string): void {
    const km = clampKmPerYear(value);
    if (km !== null) this.km.set(km);
  }

  private async fetch(versionId: string, km: number): Promise<void> {
    this.loading.set(true);
    try {
      this.cost.set(await this.costs.fetch(versionId, km));
      this.error.set(null);
    } catch (e) {
      this.cost.set(null);
      this.error.set(this.costs.errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
}
