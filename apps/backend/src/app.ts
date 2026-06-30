import express from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { ok } from "./shared/response.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { brandsRouter } from "./modules/brands/brands.routes.js";
import { modelsRouter } from "./modules/models/models.routes.js";

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.get("/health", (_req, res) => res.json(ok({ status: "ok", env: env.WEB_ORIGIN })));
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/brands", brandsRouter);
  app.use("/api/v1/models", modelsRouter);
  app.use((_req, res) => res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Ruta no encontrada" } }));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err && typeof err === "object" && "code" in err && "message" in err) {
      const e = err as { code: string; message: string; status?: number };
      return res.status(e.status ?? 500).json({ data: null, error: { code: e.code, message: e.message } });
    }
    return res.status(500).json({ data: null, error: { code: "INTERNAL", message: "Error interno" } });
  });
  return app;
};
