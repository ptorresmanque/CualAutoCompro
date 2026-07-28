import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { versionsController } from "./versions.controller.js";

export const versionsRouter = Router();
versionsRouter.get("/", versionsController.list);
// Antes de `/:id`, si no Express los matchea como id de versión.
versionsRouter.get("/fuels", versionsController.listFuels);
versionsRouter.get("/transmissions", versionsController.listTransmissions);
versionsRouter.get("/:id", versionsController.detail);

export const versionsAdminRouter = Router();
versionsAdminRouter.use(authenticate, requireRole("ADMIN"));
versionsAdminRouter.get("/", versionsController.listPaged);
versionsAdminRouter.post("/", versionsController.create);
versionsAdminRouter.post("/bulk-delete", versionsController.bulkDelete);
versionsAdminRouter.get("/export", versionsController.exportCsv);
// Antes de "/:id/price-history": si no, Express captura "options" como :id.
versionsAdminRouter.get("/options", versionsController.listOptions);
versionsAdminRouter.get("/:id/price-history", versionsController.listPriceHistory);
versionsAdminRouter.patch("/:id", versionsController.update);
versionsAdminRouter.delete("/:id", versionsController.softDelete);
versionsAdminRouter.post("/:id/restore", versionsController.restore);
