import { Router } from "express";
import { compareController } from "./compare.controller.js";
export const compareRouter = Router();
compareRouter.post("/", compareController.post);
compareRouter.get("/", compareController.get);