import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { ENV } from './env';

export type User = { id: string; email: string; name: string; role: 'USER' | 'ADMIN' };

type AuthEnvelope<T> = { data: T } | { error: { code: string } };

function hasData<T>(value: AuthEnvelope<T>): value is { data: T } {
  return 'data' in value && (value as { data: T }).data != null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  currentUser = signal<User | null>(null);

  async bootstrap(): Promise<void> {
    try {
      const res = await this.api.get<AuthEnvelope<User>>('/auth/me');
      if (hasData(res)) {
        this.currentUser.set(res.data);
      }
    } catch {
      /* no logueado */
    }
  }

  async login(email: string, password: string): Promise<void> {
    const res = await this.api.post<AuthEnvelope<User>>('/auth/login', {
      email,
      password,
    });
    if (hasData(res)) {
      this.currentUser.set(res.data);
    }
  }

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<void> {
    const res = await this.api.post<AuthEnvelope<User>>('/auth/register', {
      email,
      password,
      name,
    });
    if (hasData(res)) {
      this.currentUser.set(res.data);
    }
  }

  async logout(): Promise<void> {
    await this.api.post<AuthEnvelope<{ loggedOut: true }>>(
      '/auth/logout',
      {},
    );
    this.currentUser.set(null);
  }

  loginWithProvider(provider: 'google' | 'apple', returnTo?: string): void {
    const url = new URL(`${ENV.apiBase}/auth/${provider}`);
    if (returnTo) url.searchParams.set('returnTo', returnTo);
    window.location.assign(url.toString());
  }
}
