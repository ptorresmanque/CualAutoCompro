import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

/**
 * Servicio de tracking de popularidad (frontend).
 *
 * - Mantiene la lista de IDs de los 20 modelos mas comparados en los
 *   ultimos 30 dias (cacheada en backend con TTL 60s).
 * - Sincroniza via `refresh()` al boot y tras cada `recordAdd`.
 * - `recordAdd` es publico y anonimo: el backend resuelve la cookie/dedupe
 *   por si mismo. Si falla (red, rate-limit, etc.) swallow: el tracking
 *   nunca debe romper la UX del boton "Comparar".
 */
@Injectable({ providedIn: 'root' })
export class PopularityService {
  private api = inject(ApiService);

  private _topIds = signal<ReadonlySet<string>>(new Set());
  readonly topIds = this._topIds.asReadonly();

  private _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  async refresh(): Promise<void> {
    if (this._loading()) return;
    this._loading.set(true);
    try {
      const res = await this.api.get<{ data: { ids: string[] } }>('/popular/models');
      this._topIds.set(new Set(res.data.ids));
    } catch {
      // Si falla el refresh, mantenemos el set anterior. El tracking es
      // best-effort y no debe bloquear la app.
    } finally {
      this._loading.set(false);
    }
  }

  isPopular(modelId: string): boolean {
    return this._topIds().has(modelId);
  }

  /**
   * Fire-and-forget: registra el "click en Comparar" en backend.
   * Devuelve una promesa sin await para que la UI no se bloquee.
   *
   * Nota: invalidamos la cache del ranking solo la proxima vez que
   * se llame refresh (no automaticamente) porque la lectura es
   * inmediata tras el click y hasta 60s de desfase es aceptable.
   */
  recordAdd(versionId: string): void {
    void this.api
      .post('/popular/events', { versionId })
      .catch(() => {
        // tracking nunca debe tirar error al usuario
      });
  }
}
