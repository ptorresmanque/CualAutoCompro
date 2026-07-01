import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { ModelsService } from "./models.service.js";
import { listModelsQuerySchema } from "./models.dto.js";
import { createModelSchema, updateModelSchema } from "./models.dto.admin.js";
import { validation } from "../../shared/errors.js";

const svc = new ModelsService(prisma);

export const modelsController = {
  list: ah(async (req: Request, res: Response) => {
    const parsed = listModelsQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.list(parsed.data)));
  }),

  detail: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    if (!id) return res.status(400).json({ data: null, error: { code: "BAD_REQUEST", message: "id requerido" } });
    res.json(ok(await svc.detail(id)));
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createModelSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateModelSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.update(id, parsed.data)));
  }),

  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};