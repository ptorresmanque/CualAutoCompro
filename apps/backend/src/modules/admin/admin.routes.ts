import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { adminUsersController } from "./users.controller.js";
import { seedController } from "./seed.controller.js";
import { adminSummaryController } from "./summary.controller.js";
import { adminTrashController } from "./trash.controller.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("ADMIN"));
adminRouter.get("/summary", adminSummaryController.get);
adminRouter.get("/trash", adminTrashController.list);
adminRouter.post("/trash/:entity/:id/restore", adminTrashController.restore);
adminRouter.get("/users", adminUsersController.list);
adminRouter.post("/users/:id/promote", adminUsersController.promote);
adminRouter.post("/users/:id/demote", adminUsersController.demote);
adminRouter.get("/seed/template/:entity", seedController.template);
