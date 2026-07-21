import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-forgot-password',
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
      <h1 class="text-2xl font-bold mb-2">Recuperar contraseña</h1>
      <p class="text-sm text-ink-muted mb-6">
        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      @if (sent()) {
        <div class="rounded border border-success bg-success-light p-4 text-sm">
          <p class="font-semibold">Si la dirección existe, recibirás un correo con instrucciones.</p>
          <p class="mt-1 text-ink-muted">Revisa tu bandeja de entrada y sigue el enlace.</p>
        </div>
        <a routerLink="/login" class="mt-6 inline-flex items-center gap-1 text-engine hover:underline">
          <mat-icon>arrow_back</mat-icon>
          Volver al inicio de sesión
        </a>
      } @else {
        <form (ngSubmit)="submit()" class="space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              required
              autocomplete="email"
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
              name="email"
            />
          </mat-form-field>
          @if (error(); as err) {
            <p class="text-sm text-warn-dark">{{ err }}</p>
          }
          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="w-full"
            [disabled]="loading()"
          >
            {{ loading() ? 'Enviando…' : 'Enviar enlace' }}
          </button>
          <a routerLink="/login" class="text-sm text-engine hover:underline">Volver al inicio de sesión</a>
        </form>
      }
    </section>
  `,
})
export class ForgotPasswordComponent {
  private api = inject(ApiService);

  readonly email = signal('');
  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    if (!this.email().includes('@')) {
      this.error.set('Ingresa un email válido.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.api.post('/auth/forgot-password', { email: this.email() });
      this.sent.set(true);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
