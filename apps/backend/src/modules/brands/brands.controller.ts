import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { BrandsService } from "./brands.service.js";
import { createBrandSchema, updateBrandSchema } from "./brands.dto.admin.js";
import { validation } from "../../shared/errors.js";

const svc = new BrandsService(prisma);

export const brandsController = {
  list: ah(async (_req: Request, res: Response) =>
    res.json(ok(await svc.list())),
  ),

  listAll: ah(async (_req: Request, res: Response) =>
    res.json(ok(await svc.listAll())),
  ),

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
      throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    }
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateBrandSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    }
    res.json(ok(await svc.update(id, parsed.data)));
  }),

  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};
