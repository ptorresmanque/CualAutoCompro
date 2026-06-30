import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { comparisonsController } from "./comparisons.controller.js";

export const comparisonsRouter = Router();
comparisonsRouter.get("/:slug", comparisonsController.bySlug);
export const meComparisonsRouter = Router();
meComparisonsRouter.use(authenticate);
meComparisonsRouter.get("/", comparisonsController.listMine);
meComparisonsRouter.post("/", comparisonsController.createMine);
meComparisonsRouter.delete("/:id", comparisonsController.deleteMine);
