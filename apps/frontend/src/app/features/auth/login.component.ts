import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';
import { SocialButtonsComponent } from './social-buttons.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    SocialButtonsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly form: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }> = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitting = signal(false);
  error = signal<string | null>(null);
  readonly returnTo = signal<string | undefined>(undefined);
  readonly oauthError = signal<string | null>(null);

  readonly OAUTH_ERROR_MESSAGES: Record<string, string> = {
    OAUTH_NOT_CONFIGURED: 'El inicio con este proveedor no está disponible todavía.',
    OAUTH_STATE_INVALID: 'La sesión de autenticación expiró. Inténtalo de nuevo.',
    OAUTH_DENIED: 'Cancelaste el inicio de sesión. Puedes intentar de nuevo.',
    OAUTH_EMAIL_NOT_VERIFIED: 'Tu email no está verificado. Verifícalo y vuelve a intentar.',
    OAUTH_EMAIL_REQUIRED: 'No pudimos identificarte. Inicia sesión con email y contraseña una vez y vincula el proveedor.',
    OAUTH_PROVIDER_ERROR: 'No pudimos completar el inicio. Inténtalo en unos minutos.',
    OAUTH_INTERNAL: 'Algo salió mal. Si el problema persiste, usa email y contraseña.',
  };

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((p) => {
      const err = p.get('error');
      if (err && this.OAUTH_ERROR_MESSAGES[err]) {
        this.oauthError.set(this.OAUTH_ERROR_MESSAGES[err]);
      }
      const ret = p.get('returnTo');
      if (ret) this.returnTo.set(ret);
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      if (!this.auth.currentUser()) {
        this.error.set('Email o contraseña incorrectos.');
        return;
      }
      await this.router.navigate(['/']);
    } catch {
      this.error.set('No se pudo iniciar sesión. Revisa tus credenciales.');
    } finally {
      this.submitting.set(false);
    }
  }
}
