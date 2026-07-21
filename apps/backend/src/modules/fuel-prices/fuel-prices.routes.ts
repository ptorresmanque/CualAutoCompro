import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { fuelPricesController } from "./fuel-prices.controller.js";

export const fuelPricesRouter = Router();
fuelPricesRouter.get("/current", fuelPricesController.current);

export const fuelPricesAdminRouter = Router();
fuelPricesAdminRouter.use(authenticate, requireRole("ADMIN"));
fuelPricesAdminRouter.get("/", fuelPricesController.listPaged);
fuelPricesAdminRouter.post("/", fuelPricesController.create);
fuelPricesAdminRouter.patch("/:id", fuelPricesController.update);
fuelPricesAdminRouter.delete("/:id", fuelPricesController.softDelete);
fuelPricesAdminRouter.post("/:id/restore", fuelPricesController.restore);
