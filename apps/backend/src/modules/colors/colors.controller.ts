import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { ColorsService } from "./colors.service.js";
import {
  createColorSchema,
  updateColorSchema,
  attachColorSchema,
  syncColorsSchema,
} from "./colors.dto.admin.js";
import { validation } from "../../shared/errors.js";
import { toCsv } from "../../shared/csv.js";
import { parsePagination, sendPaged } from "../../shared/pagination.js";

const svc = new ColorsService(prisma);

export const colorsController = {
  listAll: ah(async (_req: Request, res: Response) => res.json(ok(await svc.listAll()))),

  listPaged: ah(async (req: Request, res: Response) => {
    const params = parsePagination(req.query.page, req.query.pageSize);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const { rows, total } = await svc.listPaged(q, params);
    sendPaged(res, rows, total, params);
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createColorSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateColorSchema.safeParse(req.body);
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

  attach: ah(async (req: Request, res: Response) => {
    const parsed = attachColorSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(ok(await svc.attach(parsed.data.versionId, parsed.data.colorId)));
  }),

  syncVersion: ah(async (req: Request, res: Response) => {
    const versionId = req.params.versionId ?? "";
    const parsed = syncColorsSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(ok(await svc.syncVersion(versionId, parsed.data.colorIds)));
  }),

  detach: ah(async (req: Request, res: Response) => {
    const { versionId, colorId } = req.params;
    res.json(ok(await svc.detach(versionId ?? "", colorId ?? "")));
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
      ['id', 'name', 'hex'],
      rows.map(c => [c.id, c.name, c.hex ?? '']),
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="colors.csv"');
    res.send(csv);
  }),
};
