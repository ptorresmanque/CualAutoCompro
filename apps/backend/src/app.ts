import express from "express";
import path from "node:path";
import multer from "multer";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { ok } from "./shared/response.js";
import passport from "passport";
import { authRouter } from "./modules/auth/auth.routes.js";
import { oauthRouter } from "./modules/auth/oauth.routes.js";
import { providersRouter } from "./modules/auth/providers.routes.js";
import { brandsAdminRouter, brandsRouter } from "./modules/brands/brands.routes.js";
import { modelsAdminRouter, modelsRouter } from "./modules/models/models.routes.js";
import { versionsAdminRouter, versionsRouter } from "./modules/versions/versions.routes.js";
import { compareRouter } from "./modules/compare/compare.routes.js";
import { comparisonsRouter, meComparisonsRouter } from "./modules/comparisons/comparisons.routes.js";
import { popularityRouter } from "./modules/popularity/popularity.routes.js";
import { meFavoritesRouter } from "./modules/favorites/favorites.routes.js";
import { equipmentAdminRouter, equipmentRouter } from "./modules/equipment/equipment.routes.js";
import { colorsAdminRouter } from "./modules/colors/colors.routes.js";
import { maintenanceAdminRouter, maintenanceRouter } from "./modules/maintenance/maintenance.routes.js";
import { costRouter } from "./modules/cost/cost.routes.js";
import { dealersRouter, dealersAdminRouter } from "./modules/dealers/dealers.routes.js";
import { fuelPricesRouter, fuelPricesAdminRouter } from "./modules/fuel-prices/fuel-prices.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { uploadsAdminRouter } from "./modules/uploads/uploads.routes.js";

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
  app.use(passport.initialize());
  app.use(cookieParser());
  app.get("/health", (_req, res) => res.json(ok({ status: "ok", env: env.WEB_ORIGIN })));
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/auth", providersRouter);
  app.use("/api/v1/auth", oauthRouter);
  app.use("/api/v1/brands", brandsRouter);
  app.use("/api/v1/admin/brands", brandsAdminRouter);
  app.use("/api/v1/models", modelsRouter);
  app.use("/api/v1/admin/models", modelsAdminRouter);
  app.use("/api/v1/versions", versionsRouter);
  app.use("/api/v1/admin/versions", versionsAdminRouter);
  app.use("/api/v1/compare", compareRouter);
  app.use("/api/v1/comparisons", comparisonsRouter);
  app.use("/api/v1/popular", popularityRouter);
  app.use("/api/v1/me/comparisons", meComparisonsRouter);
  app.use("/api/v1/me/favorites", meFavoritesRouter);
  app.use("/api/v1/equipment", equipmentRouter);
  app.use("/api/v1/admin/equipment", equipmentAdminRouter);
  app.use("/api/v1/admin/colors", colorsAdminRouter);
  app.use("/api/v1/maintenance", maintenanceRouter);
  app.use("/api/v1/cost", costRouter);
  app.use("/api/v1/admin/maintenance", maintenanceAdminRouter);
  // dealers nested under brands: /:brandId/dealers (no conflict with brandsRouter's /:id/models because the param value differs)
  app.use("/api/v1/brands", dealersRouter);
  app.use("/api/v1/fuel-prices", fuelPricesRouter);
  app.use("/api/v1/admin/dealers", dealersAdminRouter);
  app.use("/api/v1/admin/fuel-prices", fuelPricesAdminRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/admin/uploads", uploadsAdminRouter);
  app.use("/uploads", express.static(path.resolve(process.cwd(), "public", "uploads")));
  app.use((_req, res) => res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Ruta no encontrada" } }));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({
        data: null,
        error: { code: err.code, message: err.message },
      });
    }
    if (err && typeof err === "object" && "code" in err && "message" in err) {
      const e = err as { code: string; message: string; status?: number; details?: Record<string, unknown> };
      return res.status(e.status ?? 500).json({
        data: null,
        error: { code: e.code, message: e.message, ...(e.details ?? {}) },
      });
    }
    return res.status(500).json({ data: null, error: { code: "INTERNAL", message: "Error interno" } });
  });
  return app;
};
