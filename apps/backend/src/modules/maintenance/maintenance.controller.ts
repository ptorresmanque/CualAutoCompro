import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { MaintenanceService } from "./maintenance.service.js";
import { createMaintenanceSchema, updateMaintenanceSchema } from "./maintenance.dto.admin.js";
import { validation } from "../../shared/errors.js";
import { toCsv } from "../../shared/csv.js";
import { parsePagination, sendPaged } from "../../shared/pagination.js";

const svc = new MaintenanceService(prisma);

export const maintenanceController = {
  listByVersion: ah(async (req: Request, res: Response) => {
    const versionId = req.params.versionId ?? "";
    res.json(ok(await svc.listByVersion(versionId)));
  }),

  listAllPublic: ah(async (_req: Request, res: Response) => {
    res.json(ok(await svc.listAllPublic()));
  }),

  listPaged: ah(async (req: Request, res: Response) => {
    const params = parsePagination(req.query.page, req.query.pageSize);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const versionId =
      typeof req.query.versionId === "string" && req.query.versionId.length > 0
        ? req.query.versionId
        : undefined;
    const { rows, total } = await svc.listPaged(q, params, versionId);
    sendPaged(res, rows, total, params);
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
  restore: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.restore(id)));
  }),

  bulkDelete: ah(async (req: Request, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((x: unknown) => typeof x === "string") : [];
    if (ids.length === 0) {
      throw validation("Debes seleccionar al menos un elemento", []);
    }
    res.json(ok(await svc.bulkDelete(ids)));
  }),

  exportCsv: ah(async (_req: Request, res: Response) => {
    const rows = await svc.listAll();
    const csv = toCsv(
      ['id', 'versionId', 'mileageTag', 'costClp'],
      rows.map(m => [m.id, m.versionId, m.mileageTag, m.costClp]),
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="maintenance.csv"');
    res.send(csv);
  }),
};
