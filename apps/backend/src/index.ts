import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./infra/prisma.js";
import { createServer, withGracefulShutdown } from "./server.js";
import { syncModelYear } from "./shared/model-year.js";

const app = createApp();
const server = createServer(app);
withGracefulShutdown(server);

// El año del padrón caduca con el calendario (rollover de septiembre), así que
// se re-sincroniza al arrancar y una vez al día. Un fallo acá no debe tumbar el
// server: el catálogo sigue sirviendo con el año anterior hasta el próximo intento.
const syncYear = () =>
  void syncModelYear(prisma).catch((e: Error) =>
    // eslint-disable-next-line no-console
    console.error("No se pudo sincronizar el año de las versiones:", e.message),
  );
syncYear();
setInterval(syncYear, 24 * 60 * 60 * 1000).unref();

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`cualautocompro backend escuchando en :${env.PORT}`);
});
