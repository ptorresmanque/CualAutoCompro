import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { EquipmentService } from "./equipment.service.js";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  attachEquipmentSchema,
} from "./equipment.dto.admin.js";
import { validation } from "../../shared/errors.js";

const svc = new EquipmentService(prisma);

export const equipmentController = {
  list: ah(async (_req: Request, res: Response) => res.json(ok(await svc.list()))),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.update(id, parsed.data)));
  }),

  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),

  attach: ah(async (req: Request, res: Response) => {
    const parsed = attachEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.attach(parsed.data.versionId, parsed.data.itemId)));
  }),

  detach: ah(async (req: Request, res: Response) => {
    const { versionId, itemId } = req.params;
    res.json(ok(await svc.detach(versionId ?? "", itemId ?? "")));
  }),
};