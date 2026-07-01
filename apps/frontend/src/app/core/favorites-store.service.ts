import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private _ids = signal<Set<string>>(new Set());
  readonly ids = computed(() => Array.from(this._ids()));
  readonly count = computed(() => this._ids().size);
  readonly loaded = signal(false);

  constructor() {
    effect(() => {
      const u = this.auth.currentUser();
      if (u) {
        this.load();
      } else {
        this._ids.set(new Set());
        this.loaded.set(false);
      }
    });
  }

  isFavorite(modelId: string): boolean {
    return this._ids().has(modelId);
  }

  async toggle(modelId: string): Promise<void> {
    if (!this.auth.currentUser()) throw new Error('UNAUTHORIZED');
    if (this._ids().has(modelId)) {
      await this.api.delete(`/me/favorites/${modelId}`);
      this._ids.update((s) => {
        const n = new Set(s);
        n.delete(modelId);
        return n;
      });
    } else {
      await this.api.post('/me/favorites', { modelId });
      this._ids.update((s) => {
        const n = new Set(s);
        n.add(modelId);
        return n;
      });
    }
  }

  async load(): Promise<void> {
    try {
      const res = await this.api.get<{ data: { modelIds: string[] } }>('/me/favorites');
      this._ids.set(new Set(res.data.modelIds));
    } finally {
      this.loaded.set(true);
    }
  }
}
