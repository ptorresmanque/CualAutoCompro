import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { validation } from "../../shared/errors.js";
import { FuelPricesService } from "./fuel-prices.service.js";
import { createFuelPriceSchema } from "./fuel-prices.dto.admin.js";

const svc = new FuelPricesService(prisma);

export const fuelPricesController = {
  listAll: ah(async (_req, res) => {
    res.json(ok(await svc.listAll()));
  }),
  current: ah(async (_req, res) => {
    res.json(ok(await svc.current()));
  }),
  create: ah(async (req, res) => {
    const parsed = createFuelPriceSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),
  softDelete: ah(async (req, res) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};
