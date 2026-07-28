import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-md px-4 py-10">
      <h1 class="text-2xl font-bold mb-2">Nueva contraseña</h1>
      <p class="text-sm text-ink-muted mb-6">Elige una contraseña nueva para tu cuenta.</p>

      @if (!token()) {
        <div class="rounded border border-danger bg-danger-light p-4 text-sm">
          El enlace es inválido o ha expirado. Solicita uno nuevo.
        </div>
        <a routerLink="/account/forgot-password" class="mt-6 inline-flex items-center gap-1 text-engine hover:underline">
          <mat-icon>arrow_back</mat-icon>
          Solicitar un nuevo enlace
        </a>
      } @else if (done()) {
        <div class="rounded border border-success bg-success-light p-4 text-sm">
          <p class="font-semibold">Contraseña actualizada.</p>
          <p class="mt-1 text-ink-muted">Inicia sesión con tu nueva contraseña.</p>
        </div>
        <a routerLink="/login" class="mt-6 inline-flex items-center gap-1 text-engine hover:underline">
          Ir a iniciar sesión
        </a>
      } @else {
        <form (ngSubmit)="submit()" class="space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nueva contraseña (mín. 8)</mat-label>
            <input
              matInput
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              [ngModel]="password()"
              (ngModelChange)="password.set($event)"
              name="password"
            />
          </mat-form-field>
          @if (error(); as err) {
            <p class="text-sm text-danger-dark">{{ err }}</p>
          }
          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="w-full"
            [disabled]="loading() || password().length < 8"
          >
            {{ loading() ? 'Guardando…' : 'Cambiar contraseña' }}
          </button>
        </form>
      }
    </section>
  `,
})
export class ResetPasswordComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly token = signal<string | null>(null);
  readonly password = signal('');
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (t && t.length >= 20) this.token.set(t);
  }

  async submit(): Promise<void> {
    const tok = this.token();
    if (!tok) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.api.post('/auth/reset-password', {
        token: tok,
        newPassword: this.password(),
      });
      this.done.set(true);
    } catch (e) {
      this.error.set((e as Error).message);
      if ((e as Error).message.toLowerCase().includes('expirado')) {
        // Token expired mid-flight; clear it to show the "request new link" view.
        this.token.set(null);
      }
    } finally {
      this.loading.set(false);
    }
  }
}
