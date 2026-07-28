import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { colorsController } from "./colors.controller.js";

export const colorsAdminRouter = Router();
colorsAdminRouter.use(authenticate, requireRole("ADMIN"));
colorsAdminRouter.get("/", colorsController.listPaged);
colorsAdminRouter.post("/", colorsController.create);
colorsAdminRouter.get("/options", colorsController.listAll);
colorsAdminRouter.post("/bulk-delete", colorsController.bulkDelete);
colorsAdminRouter.get("/export", colorsController.exportCsv);
colorsAdminRouter.patch("/:id", colorsController.update);
colorsAdminRouter.delete("/:id", colorsController.softDelete);
colorsAdminRouter.post("/:id/restore", colorsController.restore);
colorsAdminRouter.post("/attach", colorsController.attach);
colorsAdminRouter.put("/version/:versionId", colorsController.syncVersion);
colorsAdminRouter.delete("/version/:versionId/color/:colorId", colorsController.detach);
