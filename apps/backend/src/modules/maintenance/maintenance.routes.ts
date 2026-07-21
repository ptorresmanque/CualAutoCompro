import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { maintenanceController } from "./maintenance.controller.js";

export const maintenanceRouter = Router();
maintenanceRouter.get("/", maintenanceController.listAllPublic);
maintenanceRouter.get("/version/:versionId", maintenanceController.listByVersion);

export const maintenanceAdminRouter = Router();
maintenanceAdminRouter.use(authenticate, requireRole("ADMIN"));
maintenanceAdminRouter.get("/", maintenanceController.listPaged);
maintenanceAdminRouter.post("/", maintenanceController.create);
maintenanceAdminRouter.post("/bulk-delete", maintenanceController.bulkDelete);
maintenanceAdminRouter.get("/export", maintenanceController.exportCsv);
maintenanceAdminRouter.patch("/:id", maintenanceController.update);
maintenanceAdminRouter.delete("/:id", maintenanceController.softDelete);
maintenanceAdminRouter.post("/:id/restore", maintenanceController.restore);
