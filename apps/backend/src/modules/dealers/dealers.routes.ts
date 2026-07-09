import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { dealersController } from "./dealers.controller.js";

export const dealersRouter = Router();
dealersRouter.get("/:brandId/dealers", dealersController.byBrand);

export const dealersAdminRouter = Router();
dealersAdminRouter.use(authenticate, requireRole("ADMIN"));
dealersAdminRouter.get("/", dealersController.listAll);
dealersAdminRouter.post("/", dealersController.create);
dealersAdminRouter.patch("/:id", dealersController.update);
dealersAdminRouter.delete("/:id", dealersController.softDelete);
