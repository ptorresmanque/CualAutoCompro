import { HttpInterceptorFn } from '@angular/common/http';
import { ENV } from './env';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(ENV.apiBase)) {
    req = req.clone({ withCredentials: true });
  }
  return next(req);
};
