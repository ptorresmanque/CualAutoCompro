import { Router } from "express";
import { brandsController } from "./brands.controller.js";
export const brandsRouter = Router();
brandsRouter.get("/", brandsController.list);
brandsRouter.get("/:id/models", brandsController.models);