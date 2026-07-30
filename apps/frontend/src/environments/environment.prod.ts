// Configuracion de entorno para PRODUCCION.
// Apunta al backend desplegado en el subdominio api.cualautocompro.cl.
//
// Antes de hacer el build de produccion, edita este archivo y reemplaza
// 'api.cualautocompro.cl' por el dominio real del backend. Esta URL debe
// coincidir con WEB_ORIGIN en apps/backend/.env del server (se usa
// en la validacion CORS del backend).
//
// Para builds automaticos desde CI, considera sustituir este archivo
// en tiempo de build (fileReplacements) en vez de editarlo a mano.

export const environment = {
  production: true,
  apiBase: 'https://api.cualautocompro.cl/api/v1',
  // Mismo valor que en environment.ts, a proposito: el canonical y el og:url
  // nunca deben apuntar a localhost, asi que el origen del sitio no depende
  // del entorno. El dominio sale de WEB_ORIGIN en apps/backend/.env.
  siteUrl: 'https://cualautocompro.cl',
} as const;
