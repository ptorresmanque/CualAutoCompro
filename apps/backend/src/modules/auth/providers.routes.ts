import { Router } from "express";
import { isAppleConfigured, isGoogleConfigured } from "./infra/passport-setup.js";

export const providersRouter = Router();

providersRouter.get("/providers", (_req, res) => {
  res.json({
    data: {
      google: isGoogleConfigured(),
      apple: isAppleConfigured(),
    },
    error: null,
  });
});
