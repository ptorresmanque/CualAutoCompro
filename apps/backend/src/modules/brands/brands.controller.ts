import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { BrandsService } from "./brands.service.js";
const svc = new BrandsService(prisma);
export const brandsController = {
  list: ah(async (_req: Request, res: Response) => res.json(ok(await svc.list()))),
  models: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    if (!id) return res.status(400).json({ data: null, error: { code: "BAD_REQUEST", message: "id requerido" } });
    res.json(ok(await svc.models(id)));
  }),
};