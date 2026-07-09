import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { fuelPricesController } from "./fuel-prices.controller.js";

export const fuelPricesRouter = Router();
fuelPricesRouter.get("/current", fuelPricesController.current);

export const fuelPricesAdminRouter = Router();
fuelPricesAdminRouter.use(authenticate, requireRole("ADMIN"));
fuelPricesAdminRouter.get("/", fuelPricesController.listAll);
fuelPricesAdminRouter.post("/", fuelPricesController.create);
fuelPricesAdminRouter.delete("/:id", fuelPricesController.softDelete);
