// Configuracion de entorno para DESARROLLO.
// El servidor de desarrollo local (ng serve) usa este archivo automaticamente.
//
// Para produccion se usa environment.prod.ts, seleccionado por
// fileReplacements en angular.json.

export const environment = {
  production: false,
  apiBase: 'http://localhost:3000/api/v1',
  // Origen publico del sitio, usado para armar `canonical`, `og:url` y las
  // imagenes absolutas de las previsualizaciones al compartir.
  //
  // Va el MISMO valor en dev y en prod a proposito: un canonical o un og:url
  // apuntando a localhost en un build de desarrollo es peor que uno fijo
  // (Google indexaria una URL inalcanzable y WhatsApp no resolveria la imagen).
  // El dominio sale de WEB_ORIGIN en apps/backend/.env.
  siteUrl: 'https://cualautocompro.cl',
} as const;
