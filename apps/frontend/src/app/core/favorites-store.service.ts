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

  isFavorite(versionId: string): boolean {
    return this._ids().has(versionId);
  }

  async toggle(args: { modelId: string; versionId: string }): Promise<void> {
    if (!this.auth.currentUser()) throw new Error('UNAUTHORIZED');
    const { modelId, versionId } = args;
    if (this._ids().has(versionId)) {
      await this.api.delete(`/me/favorites/${versionId}`);
      this._ids.update((s) => {
        const n = new Set(s);
        n.delete(versionId);
        return n;
      });
    } else {
      await this.api.post('/me/favorites', { modelId, versionId });
      this._ids.update((s) => {
        const n = new Set(s);
        n.add(versionId);
        return n;
      });
    }
  }

  async changeVersion(args: {
    currentVersionId: string;
    modelId: string;
    newVersionId: string;
  }): Promise<void> {
    if (!this.auth.currentUser()) throw new Error('UNAUTHORIZED');
    const { currentVersionId, modelId, newVersionId } = args;
    if (currentVersionId === newVersionId) return;
    await this.api.patch(`/me/favorites/${currentVersionId}`, {
      modelId,
      newVersionId,
    });
    this._ids.update((s) => {
      const n = new Set(s);
      n.delete(currentVersionId);
      n.add(newVersionId);
      return n;
    });
  }

  async load(): Promise<void> {
    const userIdAtStart = this.auth.currentUser()?.id ?? null;
    try {
      const res = await this.api.get<{ data: { versionIds: string[] } }>('/me/favorites');
      const userIdNow = this.auth.currentUser()?.id ?? null;
      if (userIdAtStart !== userIdNow) return;
      this._ids.set(new Set(res.data.versionIds));
    } finally {
      const userIdNow = this.auth.currentUser()?.id ?? null;
      if (userIdAtStart === userIdNow) {
        this.loaded.set(true);
      }
    }
  }
}