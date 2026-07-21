import { Router } from "express";
import { authController } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.get("/me", authController.me);
authRouter.patch("/me", ...authController.updateMe);
authRouter.patch("/me/password", ...authController.changePassword);
authRouter.delete("/me", ...authController.deleteMe);
