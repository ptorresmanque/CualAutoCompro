import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { adminUsersController } from "./users.controller.js";
import { seedController } from "./seed.controller.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("ADMIN"));
adminRouter.get("/users", adminUsersController.list);
adminRouter.post("/users/:id/promote", adminUsersController.promote);
adminRouter.post("/users/:id/demote", adminUsersController.demote);
adminRouter.get("/seed/template/:entity", seedController.template);