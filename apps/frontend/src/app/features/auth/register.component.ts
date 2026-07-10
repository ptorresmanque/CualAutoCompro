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
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
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
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly form: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
  }> = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitting = signal(false);
  error = signal<string | null>(null);
  readonly returnTo = signal<string | undefined>(undefined);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((p) => {
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
      const { name, email, password } = this.form.getRawValue();
      await this.auth.register(email, password, name);
      if (!this.auth.currentUser()) {
        this.error.set('No se pudo crear la cuenta.');
        return;
      }
      await this.router.navigate(['/']);
    } catch {
      this.error.set('No se pudo crear la cuenta. Revisa los datos.');
    } finally {
      this.submitting.set(false);
    }
  }
}
