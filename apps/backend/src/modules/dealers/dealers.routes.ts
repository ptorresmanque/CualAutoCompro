import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { dealersController } from "./dealers.controller.js";

export const dealersRouter = Router();
dealersRouter.get("/:brandId/dealers", dealersController.byBrand);

export const dealersAdminRouter = Router();
dealersAdminRouter.use(authenticate, requireRole("ADMIN"));
dealersAdminRouter.get("/", dealersController.listPaged);
dealersAdminRouter.post("/", dealersController.create);
dealersAdminRouter.get("/options", dealersController.listAll);
dealersAdminRouter.post("/bulk-delete", dealersController.bulkDelete);
dealersAdminRouter.get("/export", dealersController.exportCsv);
dealersAdminRouter.patch("/:id", dealersController.update);
dealersAdminRouter.delete("/:id", dealersController.softDelete);
dealersAdminRouter.post("/:id/restore", dealersController.restore);
