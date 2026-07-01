import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { maintenanceController } from "./maintenance.controller.js";

export const maintenanceRouter = Router();
maintenanceRouter.get("/version/:versionId", maintenanceController.listByVersion);

export const maintenanceAdminRouter = Router();
maintenanceAdminRouter.use(authenticate, requireRole("ADMIN"));
maintenanceAdminRouter.post("/", maintenanceController.create);
maintenanceAdminRouter.patch("/:id", maintenanceController.update);
maintenanceAdminRouter.delete("/:id", maintenanceController.softDelete);