import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { ModelsService } from "./models.service.js";
import { listModelsQuerySchema } from "./models.dto.js";
import { createModelSchema, updateModelSchema } from "./models.dto.admin.js";
import { validation } from "../../shared/errors.js";
import { toCsv } from "../../shared/csv.js";
import { parsePagination, sendPaged } from "../../shared/pagination.js";

const svc = new ModelsService(prisma);

export const modelsController = {
  list: ah(async (req: Request, res: Response) => {
    const parsed = listModelsQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(ok(await svc.list(parsed.data)));
  }),


  detailBySlug: ah(async (req: Request, res: Response) => {
    const brandSlug = (req.params.brandSlug ?? "").trim();
    const modelSlug = (req.params.modelSlug ?? "").trim();
    if (!brandSlug || !modelSlug) {
      return res.status(400).json({
        data: null,
        error: { code: "BAD_REQUEST", message: "brandSlug y modelSlug requeridos" },
      });
    }
    const detail = await svc.detailBySlug(brandSlug, modelSlug);
    if (!detail) {
      return res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Modelo no encontrado" },
      });
    }
    res.json(ok(detail));
  }),

  detail: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    if (!id) return res.status(400).json({ data: null, error: { code: "BAD_REQUEST", message: "id requerido" } });
    res.json(ok(await svc.detail(id)));
  }),

  listPaged: ah(async (req: Request, res: Response) => {
    const params = parsePagination(req.query.page, req.query.pageSize);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const { rows, total } = await svc.listPaged(q, params);
    sendPaged(res, rows, total, params);
  }),

  listAll: ah(async (_req: Request, res: Response) => {
    res.json(ok(await svc.listAll()));
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createModelSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateModelSchema.safeParse(req.body);
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
      ['id', 'name', 'brand', 'segment', 'imageUrl'],
      rows.map(m => [m.id, m.name, m.brand?.name ?? '', m.segment ?? '', m.imageUrl ?? '']),
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="models.csv"');
    res.send(csv);
  }),
};
