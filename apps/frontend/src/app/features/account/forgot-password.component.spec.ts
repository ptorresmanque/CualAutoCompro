import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  it('envía POST /auth/forgot-password y muestra confirmación', async () => {
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.componentInstance.email.set('user@example.com');
    await fixture.componentInstance.submit();

    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url.includes('/auth/forgot-password'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@example.com' });
    req.flush({ data: { sent: true }, error: null });

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.sent()).toBe(true);
  });

  it('muestra error si el email es inválido', async () => {
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.componentInstance.email.set('not-an-email');
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('Ingresa un email válido.');
  });
});
