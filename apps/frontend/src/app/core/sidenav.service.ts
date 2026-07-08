import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidenavService {
  private _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  readonly isHandset = signal(false);

  constructor() {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767.98px)');
    this.isHandset.set(mq.matches);
    mq.addEventListener('change', (e) => {
      this.isHandset.set(e.matches);
      if (!e.matches) this._isOpen.set(false);
    });
  }

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  toggle(): void {
    this._isOpen.update((v) => !v);
  }
}