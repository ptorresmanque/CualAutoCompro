import { Router } from "express";
import { costController } from "./cost.controller.js";

export const costRouter = Router();
costRouter.get("/version/:id", costController.forVersion);
