import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

interface Envelope<T> { data: T; }

@Component({
  selector: 'app-account-settings',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly user = this.auth.currentUser;
  readonly profileForm = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]] });
  readonly passwordForm = this.fb.nonNullable.group({ currentPassword: ['', Validators.required], newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]] });
  readonly profileMessage = signal<string | null>(null);
  readonly passwordMessage = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  constructor() {
    this.profileForm.patchValue({ name: this.user()?.name ?? '' });
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null); this.profileMessage.set(null);
    try {
      const res = await this.api.patch<Envelope<{ id: string; email: string; name: string; role: 'USER' | 'ADMIN' }>>('/auth/me', this.profileForm.getRawValue());
      this.auth.currentUser.set(res.data);
      this.profileMessage.set('Perfil actualizado.');
    } catch { this.error.set('No se pudo actualizar el perfil.'); }
    finally { this.saving.set(false); }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null); this.passwordMessage.set(null);
    try {
      await this.api.patch<Envelope<{ updated: true }>>('/auth/me/password', this.passwordForm.getRawValue());
      this.passwordForm.reset();
      this.passwordMessage.set('Contraseña actualizada.');
    } catch { this.error.set('No se pudo actualizar la contraseña.'); }
    finally { this.saving.set(false); }
  }

  async deleteAccount(): Promise<void> {
    const password = window.prompt('Ingresa tu contraseña para confirmar el cierre de cuenta.');
    if (password === null) return;
    if (!window.confirm('Esta acción eliminará tus favoritos y comparaciones. ¿Continuar?')) return;
    try {
      await this.api.delete<Envelope<{ deleted: true }>>('/auth/me', { currentPassword: password });
      this.auth.currentUser.set(null);
      await this.router.navigate(['/']);
    } catch { this.error.set('No se pudo cerrar la cuenta.'); }
  }
}
