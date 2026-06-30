import { Router } from "express";
import { modelsController } from "./models.controller.js";

export const modelsRouter = Router();
modelsRouter.get("/", modelsController.list);
modelsRouter.get("/:id", modelsController.detail);