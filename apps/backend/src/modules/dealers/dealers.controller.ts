import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { validation } from "../../shared/errors.js";
import { DealersService } from "./dealers.service.js";
import { createDealerSchema, updateDealerSchema } from "./dealers.dto.admin.js";

const svc = new DealersService(prisma);

export const dealersController = {
  listAll: ah(async (_req: Request, res: Response) => {
    res.json(ok(await svc.listAll()));
  }),
  byBrand: ah(async (req: Request, res: Response) => {
    const brandId = req.params.brandId ?? "";
    res.json(ok(await svc.byBrand(brandId)));
  }),
  create: ah(async (req: Request, res: Response) => {
    const parsed = createDealerSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),
  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateDealerSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.update(id, parsed.data)));
  }),
  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};
