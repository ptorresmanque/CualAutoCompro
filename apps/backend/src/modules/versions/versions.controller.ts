import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { VersionsService } from "./versions.service.js";
import { createVersionSchema, updateVersionSchema } from "./versions.dto.admin.js";
import { validation } from "../../shared/errors.js";
import { toCsv } from "../../shared/csv.js";
import { parsePagination, sendPaged } from "../../shared/pagination.js";

const VERSION_LABELS: Record<string, string> = {
  TRACTION_FRONT: "Delantera", TRACTION_REAR: "Trasera", TRACTION_AWD: "Integral", TRACTION_4X4_LOW: "4x4 con reductora",
  ENGINE_NA: "Aspirado", ENGINE_TURBO: "Turbo", ENGINE_TWIN_TURBO: "Bi Turbo",
};

const svc = new VersionsService(prisma);

export const versionsController = {
  list: ah(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(Number(req.query.pageSize) || 50, 50);
    res.json(ok(await svc.list({ page, pageSize })));
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


  listPriceHistory: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    if (!id) return res.status(400).json({ data: null, error: { code: "BAD_REQUEST", message: "id requerido" } });
    res.json(ok(await svc.listPriceHistory(id)));
  }),

  listAll: ah(async (_req: Request, res: Response) => {
    res.json(ok(await svc.listAll()));
  }),

  /**
   * Opciones para `app-select-search` / `app-multi-select-field`, que leen la
   * etiqueta desde el campo indicado por `optionLabel` (por defecto `name`).
   * Por eso `name` se aplana a "Modelo Nombre (Año)" y el nombre crudo del
   * modelo queda aparte en `modelName`.
   */
  listOptions: ah(async (_req: Request, res: Response) => {
    const rows = await svc.listOptions();
    res.json(
      ok(
        rows.map((v) => ({
          id: v.id,
          name: `${v.model.name} ${v.name} (${v.year})`,
          year: v.year,
          modelName: v.model.name,
        })),
      ),
    );
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createVersionSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateVersionSchema.safeParse(req.body);
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
      ['id', 'name', 'model', 'year', 'priceClp', 'transmission', 'fuel', 'traction', 'engineType'],
      rows.map(v => [v.id, v.name, v.model?.name ?? '', v.year ?? '', v.priceClp, v.transmission, v.fuel, VERSION_LABELS[v.traction ?? ''] ?? v.traction ?? '', VERSION_LABELS[v.engineType ?? ''] ?? v.engineType ?? '']),
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="versions.csv"');
    res.send(csv);
  }),
};
