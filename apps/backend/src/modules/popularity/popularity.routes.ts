import { Router } from "express";
import { popularityController } from "./popularity.controller.js";

export const popularityRouter = Router();
popularityRouter.post("/events", popularityController.record);
popularityRouter.get("/models", popularityController.top);
