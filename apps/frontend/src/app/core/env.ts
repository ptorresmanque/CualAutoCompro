// Punto unico de acceso a la configuracion de entorno.
//
// En tiempo de build, Angular CLI reemplaza este archivo con
// environment.prod.ts cuando se compila con --configuration production
// (ver fileReplacements en angular.json). Asi el bundle final lleva
// la URL correcta del backend de produccion sin necesidad de inyeccion
// en runtime.
//
// El fallback a window.__env se mantiene por compatibilidad con
// despliegues que prefieran inyectar la URL en runtime via un
// <script> en index.html.

import { environment } from '../../environments/environment';

export const ENV = {
  apiBase:
    (typeof window !== 'undefined' &&
      (window as { __env?: { apiBase?: string } }).__env?.apiBase) ||
    environment.apiBase,
  production: environment.production,
} as const;
