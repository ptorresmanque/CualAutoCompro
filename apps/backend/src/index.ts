import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createServer, withGracefulShutdown } from "./server.js";

const app = createApp();
const server = createServer(app);
withGracefulShutdown(server);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`cualautocompro backend escuchando en :${env.PORT}`);
});
