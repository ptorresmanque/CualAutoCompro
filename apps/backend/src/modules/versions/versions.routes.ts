import { Router } from "express";
import { versionsController } from "./versions.controller.js";
export const versionsRouter = Router();
versionsRouter.get("/:id", versionsController.detail);