import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { modelsController } from "./models.controller.js";

export const modelsRouter = Router();
modelsRouter.get("/", modelsController.list);
modelsRouter.get("/by-slug/:brandSlug/:modelSlug", modelsController.detailBySlug);
modelsRouter.get("/:id", modelsController.detail);

export const modelsAdminRouter = Router();
modelsAdminRouter.use(authenticate, requireRole("ADMIN"));
modelsAdminRouter.get("/", modelsController.listPaged);
modelsAdminRouter.post("/", modelsController.create);
modelsAdminRouter.post("/bulk-delete", modelsController.bulkDelete);
modelsAdminRouter.get("/export", modelsController.exportCsv);
modelsAdminRouter.patch("/:id", modelsController.update);
modelsAdminRouter.delete("/:id", modelsController.softDelete);
modelsAdminRouter.post("/:id/restore", modelsController.restore);
