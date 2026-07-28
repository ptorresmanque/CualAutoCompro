import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

/**
 * Caché de listas de opciones del admin (`/options`, `/categories`,
 * `/admin/seed/template/:key`).
 *
 * Sin esto, abrir el diálogo de una versión dispara un GET por cada campo de
 * selección — modelos, equipamiento y colores — en *cada* apertura.
 *
 * Se memoiza la Promise y no el resultado: si dos campos piden el mismo path
 * en el mismo tick, comparten un único request. Una promesa rechazada se saca
 * de la caché para que el siguiente intento reintente de verdad.
 */
@Injectable({ providedIn: 'root' })
export class AdminOptionsCacheService {
  private api = inject(ApiService);
  private readonly inFlight = new Map<string, Promise<unknown>>();

  get<T = { id: string; [k: string]: unknown }>(path: string): Promise<T[]> {
    const cached = this.inFlight.get(path);
    if (cached) return cached as Promise<T[]>;

    const promise = this.api
      .get<{ data: T[] }>(path)
      .then((res) => res.data)
      .catch((err: unknown) => {
        this.inFlight.delete(path);
        throw err;
      });

    this.inFlight.set(path, promise);
    return promise;
  }

  /**
   * Igual que `get()` pero para respuestas que no son listas (la plantilla de
   * `/admin/seed/template/:key` es un objeto).
   */
  getObject<T>(path: string): Promise<T> {
    return this.get<T>(path) as unknown as Promise<T>;
  }

  invalidate(path: string): void {
    this.inFlight.delete(path);
  }

  clear(): void {
    this.inFlight.clear();
  }
}
