import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';
import { ENV } from './env';

describe('authGuard', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('redirige a /login cuando el usuario no está autenticado', async () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as never,
        { url: '/account/comparisons' } as never,
      ),
    ) as Promise<UrlTree | boolean>;
    const req = http.expectOne(`${ENV.apiBase}/auth/me`);
    req.flush({ error: { code: 'UNAUTHENTICATED' } });
    const settled = await result;
    expect(settled).toBeInstanceOf(UrlTree);
    const tree = settled as UrlTree;
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(tree)).toBe('/login');
  });
});