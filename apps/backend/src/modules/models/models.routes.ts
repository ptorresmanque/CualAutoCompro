import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { modelsController } from "./models.controller.js";

export const modelsRouter = Router();
modelsRouter.get("/", modelsController.list);
modelsRouter.get("/:id", modelsController.detail);

export const modelsAdminRouter = Router();
modelsAdminRouter.use(authenticate, requireRole("ADMIN"));
modelsAdminRouter.get("/", modelsController.listAll);
modelsAdminRouter.post("/", modelsController.create);
modelsAdminRouter.patch("/:id", modelsController.update);
modelsAdminRouter.delete("/:id", modelsController.softDelete);