import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { favoritesController } from "./favorites.controller.js";

export const meFavoritesRouter = Router();
meFavoritesRouter.use(authenticate);
meFavoritesRouter.get("/", favoritesController.listIds);
meFavoritesRouter.get("/models", favoritesController.listModels);
meFavoritesRouter.post("/", favoritesController.add);
meFavoritesRouter.delete("/:modelId", favoritesController.remove);
