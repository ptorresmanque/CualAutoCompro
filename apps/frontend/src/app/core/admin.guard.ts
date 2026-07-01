import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.currentUser()) await auth.bootstrap();
  const u = auth.currentUser();
  if (!u) return router.createUrlTree(['/login']);
  if (u.role !== 'ADMIN') return router.createUrlTree(['/']);
  return true;
};