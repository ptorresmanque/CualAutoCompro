import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { VersionsService } from "./versions.service.js";
import { createVersionSchema, updateVersionSchema } from "./versions.dto.admin.js";
import { validation } from "../../shared/errors.js";

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

  listAll: ah(async (_req: Request, res: Response) => {
    res.json(ok(await svc.listAll()));
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createVersionSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateVersionSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.update(id, parsed.data)));
  }),

  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};
