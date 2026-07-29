import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { convertToParamMap } from '@angular/router';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  it('lee token del queryParam y lo envía en el body', async () => {
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ token: 'a'.repeat(30) }),
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    expect(fixture.componentInstance.token()).toBe('a'.repeat(30));

    fixture.componentInstance.password.set('new-pass-1234');
    // Sin await todavía: `submit()` solo resuelve cuando este mismo test
    // flushea el request, así que esperarlo acá deadlockea hasta el timeout.
    const submitted = fixture.componentInstance.submit();

    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url.includes('/auth/reset-password'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      token: 'a'.repeat(30),
      newPassword: 'new-pass-1234',
    });
    req.flush({ data: { updated: true }, error: null });

    await submitted;
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.done()).toBe(true);
  });

  it('marca token como null si no se proporciona o es muy corto', () => {
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    expect(fixture.componentInstance.token()).toBeNull();
  });
});
