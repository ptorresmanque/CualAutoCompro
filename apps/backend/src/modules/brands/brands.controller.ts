import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { BrandsService } from "./brands.service.js";
import { createBrandSchema, updateBrandSchema } from "./brands.dto.admin.js";
import { validation } from "../../shared/errors.js";
import { parsePagination, sendPaged } from "../../shared/pagination.js";
import { sendCsv } from "../../shared/csv.js";

const svc = new BrandsService(prisma);

export const brandsController = {
  list: ah(async (_req: Request, res: Response) =>
    res.json(ok(await svc.list())),
  ),

  listAll: ah(async (_req: Request, res: Response) =>
    res.json(ok(await svc.listAll())),
  ),

  listPaged: ah(async (req: Request, res: Response) => {
    const params = parsePagination(req.query.page, req.query.pageSize);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const { rows, total } = await svc.listPaged(q, params);
    sendPaged(res, rows, total, params);
  }),

  models: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    if (!id) {
      return res.status(400).json({
        data: null,
        error: { code: "BAD_REQUEST", message: "id requerido" },
      });
    }
    res.json(ok(await svc.models(id)));
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createBrandSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validation("Datos inválidos", parsed.error.issues);
    }
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateBrandSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validation("Datos inválidos", parsed.error.issues);
    }
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
    sendCsv(res, "brands.csv",
      ["id", "name", "logoUrl"],
      rows.map((b) => [b.id, b.name, b.logoUrl ?? ""]),
    );
  }),
};
