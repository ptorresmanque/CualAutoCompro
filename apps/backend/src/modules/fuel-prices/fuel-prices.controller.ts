import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { validation } from "../../shared/errors.js";
import { sendCsv } from "../../shared/csv.js";
import { parsePagination, sendPaged } from "../../shared/pagination.js";
import { FuelPricesService } from "./fuel-prices.service.js";
import { createFuelPriceSchema, updateFuelPriceSchema } from "./fuel-prices.dto.admin.js";

const svc = new FuelPricesService(prisma);

export const fuelPricesController = {
  listPaged: ah(async (req, res) => {
    const params = parsePagination(req.query.page, req.query.pageSize);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const { rows, total } = await svc.listPaged(q, params);
    sendPaged(res, rows, total, params);
  }),

  listAll: ah(async (_req, res) => {
    res.json(ok(await svc.listAll()));
  }),
  current: ah(async (_req, res) => {
    res.json(ok(await svc.current()));
  }),
  create: ah(async (req, res) => {
    const parsed = createFuelPriceSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),
  update: ah(async (req, res) => {
    const id = req.params.id ?? "";
    const parsed = updateFuelPriceSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(ok(await svc.update(id, parsed.data)));
  }),
  softDelete: ah(async (req, res) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
  restore: ah(async (req, res) => {
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
    sendCsv(res, "fuel-prices.csv",
      ['id', 'fuelType', 'pricePerUnitClp', 'unit', 'effectiveFrom'],
      rows.map(f => [f.id, f.fuelType, f.pricePerUnitClp, f.unit, f.effectiveFrom]),
    );
  }),
};
