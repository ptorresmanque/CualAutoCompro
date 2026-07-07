// Configuracion de entorno para PRODUCCION.
// Apunta al backend desplegado en el subdominio api.midominio.com.
//
// Antes de hacer el build de produccion, edita este archivo y reemplaza
// 'api.midominio.com' por el dominio real del backend. Esta URL debe
// coincidir con WEB_ORIGIN en apps/backend/.env del server (se usa
// en la validacion CORS del backend).
//
// Para builds automaticos desde CI, considera sustituir este archivo
// en tiempo de build (fileReplacements) en vez de editarlo a mano.

export const environment = {
  production: true,
  apiBase: 'https://api.midominio.com/api/v1',
} as const;
