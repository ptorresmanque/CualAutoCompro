import { Router } from "express";
import multer from "multer";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { uploadsController } from "./uploads.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadsAdminRouter = Router();
uploadsAdminRouter.use(authenticate, requireRole("ADMIN"));
uploadsAdminRouter.post("/", upload.single("file"), uploadsController.upload);