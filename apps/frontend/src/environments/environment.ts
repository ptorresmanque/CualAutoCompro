// Configuracion de entorno para DESARROLLO.
// El servidor de desarrollo local (ng serve) usa este archivo automaticamente.
//
// Para produccion se usa environment.prod.ts, seleccionado por
// fileReplacements en angular.json.

export const environment = {
  production: false,
  apiBase: 'http://localhost:3000/api/v1',
} as const;
