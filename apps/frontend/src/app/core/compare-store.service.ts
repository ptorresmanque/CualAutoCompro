import { Injectable, signal } from '@angular/core';

const KEY = 'cualautocompro:selectedVersionIds';
const MAX = 3;

@Injectable({ providedIn: 'root' })
export class CompareStore {
  private _ids = signal<string[]>(this.load());
  readonly ids = this._ids.asReadonly();

  add(id: string): void {
    const current = this._ids();
    if (current.includes(id) || current.length >= MAX) return;
    const next = [...current, id];
    this._ids.set(next);
    this.save(next);
  }

  remove(id: string): void {
    const next = this._ids().filter((x) => x !== id);
    this._ids.set(next);
    this.save(next);
  }

  clear(): void {
    this._ids.set([]);
    this.save([]);
  }

  hydrateFromUrl(csv: string): void {
    const ids = csv.split(',').map((s) => s.trim()).filter(Boolean).slice(0, MAX);
    this._ids.set(ids);
    this.save(ids);
  }

  setIds(ids: string[]): void {
    const capped = ids.slice(0, MAX);
    this._ids.set([...capped]);
    this.save(capped);
  }

  private save(ids: string[]): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }

  private load(): string[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }
}
