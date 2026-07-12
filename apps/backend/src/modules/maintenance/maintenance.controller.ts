import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { MaintenanceService } from "./maintenance.service.js";
import { createMaintenanceSchema, updateMaintenanceSchema } from "./maintenance.dto.admin.js";
import { validation } from "../../shared/errors.js";

const svc = new MaintenanceService(prisma);

export const maintenanceController = {
  listByVersion: ah(async (req: Request, res: Response) => {
    const versionId = req.params.versionId ?? "";
    res.json(ok(await svc.listByVersion(versionId)));
  }),

  listAllPublic: ah(async (_req: Request, res: Response) => {
    res.json(ok(await svc.listAllPublic()));
  }),

  listAll: ah(async (_req: Request, res: Response) => {
    res.json(ok(await svc.listAll()));
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createMaintenanceSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateMaintenanceSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(ok(await svc.update(id, parsed.data)));
  }),

  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};