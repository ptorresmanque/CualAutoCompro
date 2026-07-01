import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ENV } from './env';

describe('AuthService', () => {
  let svc: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });
    svc = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('bootstrap hidrata currentUser con /auth/me', async () => {
    const p = svc.bootstrap();
    const req = http.expectOne(`${ENV.apiBase}/auth/me`);
    req.flush({
      data: { id: 'u1', email: '[email protected]', name: 'P' },
    });
    await p;
    expect(svc.currentUser()?.email).toBe('[email protected]');
  });

  it('login dispara POST y setea currentUser', async () => {
    const p = svc.login('[email protected]', 'secreto123');
    const req = http.expectOne(`${ENV.apiBase}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({
      data: { id: 'u1', email: '[email protected]', name: 'P' },
    });
    await p;
    expect(svc.currentUser()?.email).toBe('[email protected]');
  });

  it('logout limpia currentUser', async () => {
    svc.currentUser.set({
      id: 'u1',
      email: '[email protected]',
      name: 'P',
      role: 'USER',
    });
    const p = svc.logout();
    const req = http.expectOne(`${ENV.apiBase}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: { loggedOut: true } });
    await p;
    expect(svc.currentUser()).toBeNull();
  });

  it('bootstrap no asigna usuario si la respuesta no tiene data', async () => {
    const p = svc.bootstrap();
    const req = http.expectOne(`${ENV.apiBase}/auth/me`);
    req.flush({ error: { code: 'UNAUTHENTICATED' } });
    await p;
    expect(svc.currentUser()).toBeNull();
  });
});
