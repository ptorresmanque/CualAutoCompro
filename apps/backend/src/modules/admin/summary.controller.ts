import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";

export const adminSummaryController = {
  get: ah(async (_req: Request, res: Response) => {
    const [brands, models, versions, equipment, maintenance, dealers, fuelPrices, users] =
      await Promise.all([
        prisma.brand.count({ where: { deletedAt: null } }),
        prisma.model.count({ where: { deletedAt: null, brand: { deletedAt: null } } }),
        prisma.version.count({ where: { deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } } }),
        prisma.equipmentItem.count({ where: { deletedAt: null } }),
        prisma.maintenanceCost.count({ where: { deletedAt: null, version: { deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } } } }),
        prisma.dealer.count({ where: { deletedAt: null } }),
        prisma.fuelPrice.count({ where: { deletedAt: null } }),
        prisma.user.count(),
      ]);
    res.json(ok({ brands, models, versions, equipment, maintenance, dealers, fuelPrices, users }));
  }),
};
