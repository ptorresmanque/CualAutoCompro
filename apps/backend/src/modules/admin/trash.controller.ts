import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { badRequest, conflict, notFound } from "../../shared/errors.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";

const ENTITY_NAMES = ["brands", "models", "versions", "equipment", "maintenance", "dealers", "fuelPrices"] as const;
type EntityName = (typeof ENTITY_NAMES)[number];

export const adminTrashController = {
  list: ah(async (_req: Request, res: Response) => {
    const [brands, models, versions, equipment, maintenance, dealers, fuelPrices] = await Promise.all([
      prisma.brand.findMany({ where: { deletedAt: { not: null } }, select: { id: true, name: true, deletedAt: true }, orderBy: { deletedAt: "desc" } }),
      prisma.model.findMany({ where: { deletedAt: { not: null } }, select: { id: true, name: true, deletedAt: true, brand: { select: { name: true } } }, orderBy: { deletedAt: "desc" } }),
      prisma.version.findMany({ where: { deletedAt: { not: null } }, select: { id: true, name: true, deletedAt: true, model: { select: { name: true, brand: { select: { name: true } } } } }, orderBy: { deletedAt: "desc" } }),
      prisma.equipmentItem.findMany({ where: { deletedAt: { not: null } }, select: { id: true, name: true, category: true, deletedAt: true }, orderBy: { deletedAt: "desc" } }),
      prisma.maintenanceCost.findMany({ where: { deletedAt: { not: null } }, select: { id: true, mileageTag: true, costClp: true, deletedAt: true, version: { select: { name: true } } }, orderBy: { deletedAt: "desc" } }),
      prisma.dealer.findMany({ where: { deletedAt: { not: null } }, select: { id: true, name: true, deletedAt: true }, orderBy: { deletedAt: "desc" } }),
      prisma.fuelPrice.findMany({ where: { deletedAt: { not: null } }, select: { id: true, fuelType: true, pricePerUnitClp: true, unit: true, deletedAt: true }, orderBy: { deletedAt: "desc" } }),
    ]);
    res.json(ok({ brands, models, versions, equipment, maintenance, dealers, fuelPrices }));
  }),

  restore: ah(async (req: Request, res: Response) => {
    const entity = req.params.entity as EntityName;
    const id = req.params.id ?? "";
    if (!ENTITY_NAMES.includes(entity)) throw badRequest("Entidad de papelera no soportada");
    if (!id) throw badRequest("id requerido");
    try {
      const restored = entity === "brands"
        ? await prisma.brand.update({ where: { id }, data: { deletedAt: null } })
        : entity === "models"
          ? await prisma.model.update({ where: { id }, data: { deletedAt: null } })
          : entity === "versions"
            ? await prisma.version.update({ where: { id }, data: { deletedAt: null } })
            : entity === "equipment"
              ? await prisma.equipmentItem.update({ where: { id }, data: { deletedAt: null } })
              : entity === "maintenance"
                ? await prisma.maintenanceCost.update({ where: { id }, data: { deletedAt: null } })
                : entity === "dealers"
                  ? await prisma.dealer.update({ where: { id }, data: { deletedAt: null } })
                  : await prisma.fuelPrice.update({ where: { id }, data: { deletedAt: null } });
      res.json(ok(restored));
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
        throw notFound("Registro no encontrado en la papelera");
      }
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        throw conflict("No se puede restaurar: ya existe un registro activo con el mismo identificador");
      }
      throw error;
    }
  }),
};
