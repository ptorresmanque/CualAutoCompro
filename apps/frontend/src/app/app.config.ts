import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { loadingInterceptor } from './core/loading.interceptor';
import { AuthService } from './core/auth.service';
import { PopularityService } from './core/popularity.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `withInMemoryScrolling` restaura el scroll de la VENTANA. Acá alcanza:
    // el shell usa `mat-sidenav-container`, pero ni `.app-shell` ni
    // `.app-sidenav-content` imponen alto fijo, así que crecen con el
    // contenido y el que scrollea de verdad es el documento.
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
    provideAppInitializer(() => inject(AuthService).bootstrap()),
    provideAppInitializer(() => inject(PopularityService).refresh()),
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: { fontSet: 'material-icons' },
    },
  ],
};
