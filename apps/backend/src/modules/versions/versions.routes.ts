import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { versionsController } from "./versions.controller.js";

export const versionsRouter = Router();
versionsRouter.get("/", versionsController.list);
versionsRouter.get("/:id", versionsController.detail);

export const versionsAdminRouter = Router();
versionsAdminRouter.use(authenticate, requireRole("ADMIN"));
versionsAdminRouter.post("/", versionsController.create);
versionsAdminRouter.patch("/:id", versionsController.update);
versionsAdminRouter.delete("/:id", versionsController.softDelete);
