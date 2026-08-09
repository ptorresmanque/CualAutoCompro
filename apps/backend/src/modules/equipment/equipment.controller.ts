import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { EquipmentService } from "./equipment.service.js";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  attachEquipmentSchema,
  syncEquipmentSchema,
} from "./equipment.dto.admin.js";
import { validation } from "../../shared/errors.js";
import { sendCsv } from "../../shared/csv.js";
import { parsePagination, sendPaged } from "../../shared/pagination.js";

const svc = new EquipmentService(prisma);

export const equipmentController = {
  list: ah(async (_req: Request, res: Response) => res.json(ok(await svc.list()))),

  listPaged: ah(async (req: Request, res: Response) => {
    const params = parsePagination(req.query.page, req.query.pageSize);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const { rows, total } = await svc.listPaged(q, params);
    sendPaged(res, rows, total, params);
  }),

  listAll: ah(async (_req: Request, res: Response) => res.json(ok(await svc.listAll()))),

  listCategories: ah(async (_req: Request, res: Response) =>
    res.json(ok(await svc.listCategories())),
  ),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateEquipmentSchema.safeParse(req.body);
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
    const parsed = attachEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(ok(await svc.attach(parsed.data.versionId, parsed.data.itemId)));
  }),

  syncVersion: ah(async (req: Request, res: Response) => {
    const versionId = req.params.versionId ?? "";
    const parsed = syncEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(
      ok(await svc.syncVersion(versionId, parsed.data.itemIds, parsed.data.knownInheritedIds)),
    );
  }),

  syncBrand: ah(async (req: Request, res: Response) => {
    const brandId = req.params.brandId ?? "";
    const parsed = syncEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(ok(await svc.syncBrand(brandId, parsed.data.itemIds)));
  }),

  syncModel: ah(async (req: Request, res: Response) => {
    const modelId = req.params.modelId ?? "";
    const parsed = syncEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(ok(await svc.syncModel(modelId, parsed.data.itemIds)));
  }),

  detach: ah(async (req: Request, res: Response) => {
    const { versionId, itemId } = req.params;
    res.json(ok(await svc.detach(versionId ?? "", itemId ?? "")));
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
    sendCsv(res, "equipment.csv",
      ['id', 'name', 'category'],
      rows.map(e => [e.id, e.name, e.category]),
    );
  }),
};
