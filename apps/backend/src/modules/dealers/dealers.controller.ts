import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { validation } from "../../shared/errors.js";
import { sendCsv } from "../../shared/csv.js";
import { parsePagination, sendPaged } from "../../shared/pagination.js";
import { DealersService } from "./dealers.service.js";
import { createDealerSchema, updateDealerSchema } from "./dealers.dto.admin.js";

const svc = new DealersService(prisma);

export const dealersController = {
  listPaged: ah(async (req: Request, res: Response) => {
    const params = parsePagination(req.query.page, req.query.pageSize);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const { rows, total } = await svc.listPaged(q, params);
    sendPaged(res, rows, total, params);
  }),

  listAll: ah(async (_req: Request, res: Response) => {
    res.json(ok(await svc.listAll()));
  }),
  byBrand: ah(async (req: Request, res: Response) => {
    const brandId = req.params.brandId ?? "";
    res.json(ok(await svc.byBrand(brandId)));
  }),
  create: ah(async (req: Request, res: Response) => {
    const parsed = createDealerSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),
  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateDealerSchema.safeParse(req.body);
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
    sendCsv(res, "dealers.csv",
      ['id', 'name', 'url', 'logoUrl'],
      rows.map(d => [d.id, d.name, d.url ?? '', d.logoUrl ?? '']),
    );
  }),
};
