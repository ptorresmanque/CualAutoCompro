import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { ENV } from '../../core/env';

type ProvidersResponse = { data?: { google: boolean; apple: boolean } };

@Component({
  selector: 'app-social-buttons',
  templateUrl: './social-buttons.component.html',
  styleUrl: './social-buttons.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialButtonsComponent implements OnInit {
  private auth = inject(AuthService);

  mode = input<'login' | 'register'>('login');
  returnTo = input<string | undefined>(undefined);

  googleEnabled = signal(false);
  appleEnabled = signal(false);
  loaded = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const res = await fetch(`${ENV.apiBase}/auth/providers`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const body = (await res.json()) as ProvidersResponse;
      this.googleEnabled.set(!!body.data?.google);
      this.appleEnabled.set(!!body.data?.apple);
    } catch {
      /* graceful: oculta los botones */
    } finally {
      this.loaded.set(true);
    }
  }

  go(provider: 'google' | 'apple'): void {
    this.auth.loginWithProvider(provider, this.returnTo());
  }
}
