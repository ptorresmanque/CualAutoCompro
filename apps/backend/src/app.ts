import express from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { ok } from "./shared/response.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { brandsRouter } from "./modules/brands/brands.routes.js";
import { modelsRouter } from "./modules/models/models.routes.js";
import { versionsRouter } from "./modules/versions/versions.routes.js";
import { compareRouter } from "./modules/compare/compare.routes.js";
import { comparisonsRouter, meComparisonsRouter } from "./modules/comparisons/comparisons.routes.js";

export const createApp = () => {
  const app = express();
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin === env.WEB_ORIGIN) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      );
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });
  app.use(express.json());
  app.use(cookieParser());
  app.get("/health", (_req, res) => res.json(ok({ status: "ok", env: env.WEB_ORIGIN })));
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/brands", brandsRouter);
  app.use("/api/v1/models", modelsRouter);
  app.use("/api/v1/versions", versionsRouter);
  app.use("/api/v1/compare", compareRouter);
  app.use("/api/v1/comparisons", comparisonsRouter);
  app.use("/api/v1/me/comparisons", meComparisonsRouter);
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
