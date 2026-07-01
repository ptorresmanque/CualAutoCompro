import { TestBed } from '@angular/core/testing';
import { Router, type CanActivateFn } from '@angular/router';
import { provideRouter } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService, type User } from './auth.service';

describe('adminGuard', () => {
  let authStub: { currentUser: () => User | null; bootstrap: () => Promise<void> };

  const setup = () => {
    authStub = {
      currentUser: () => null,
      bootstrap: async () => undefined,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
      ],
    });
  };

  const run: CanActivateFn = (...args) => TestBed.runInInjectionContext(() => adminGuard(...args));

  it('redirige a /login si no hay user', async () => {
    setup();
    authStub.currentUser = () => null;
    const result = await run({} as never, {} as never);
    expect(String(result)).toContain('/login');
  });

  it('redirige a / si hay user pero no es admin', async () => {
    setup();
    authStub.currentUser = () => ({ id: 'u1', email: 'a@b.c', name: 'X', role: 'USER' });
    const result = await run({} as never, {} as never);
    expect(String(result)).toBe('/');
  });

  it('permite si user es admin', async () => {
    setup();
    authStub.currentUser = () => ({ id: 'u1', email: 'a@b.c', name: 'X', role: 'ADMIN' });
    const result = await run({} as never, {} as never);
    expect(result).toBe(true);
  });
});