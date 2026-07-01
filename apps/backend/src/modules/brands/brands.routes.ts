import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { brandsController } from "./brands.controller.js";

export const brandsRouter = Router();
brandsRouter.get("/", brandsController.list);
brandsRouter.get("/:id/models", brandsController.models);

export const brandsAdminRouter = Router();
brandsAdminRouter.use(authenticate, requireRole("ADMIN"));
brandsAdminRouter.get("/", brandsController.listAll);
brandsAdminRouter.post("/", brandsController.create);
brandsAdminRouter.patch("/:id", brandsController.update);
brandsAdminRouter.delete("/:id", brandsController.softDelete);
