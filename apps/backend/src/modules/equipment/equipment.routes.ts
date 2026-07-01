import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { equipmentController } from "./equipment.controller.js";

export const equipmentRouter = Router();
equipmentRouter.get("/", equipmentController.list);

export const equipmentAdminRouter = Router();
equipmentAdminRouter.use(authenticate, requireRole("ADMIN"));
equipmentAdminRouter.get("/", equipmentController.listAll);
equipmentAdminRouter.post("/", equipmentController.create);
equipmentAdminRouter.patch("/:id", equipmentController.update);
equipmentAdminRouter.delete("/:id", equipmentController.softDelete);
equipmentAdminRouter.post("/attach", equipmentController.attach);
equipmentAdminRouter.delete("/version/:versionId/item/:itemId", equipmentController.detach);