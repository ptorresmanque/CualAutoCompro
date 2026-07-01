import { z } from "zod";
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { unauthorized, validation } from "../../shared/errors.js";
import { FavoritesService } from "./favorites.service.js";

const svc = new FavoritesService(prisma);
const addSchema = z.object({
  modelId: z.string().min(1),
  versionId: z.string().min(1),
});
const updateVersionSchema = z.object({
  modelId: z.string().min(1),
  newVersionId: z.string().min(1),
});

export const favoritesController = {
  listIds: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    res.json(ok({ versionIds: await svc.listIds(u.id) }));
  }),

  listModels: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    res.json(ok(await svc.listModels(u.id)));
  }),

  add: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    const { created, versionId } = await svc.add(u.id, parsed.data);
    res.json(ok({ versionId, created }));
  }),

  updateVersion: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    const parsed = updateVersionSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    const currentVersionId = req.params.versionId ?? "";
    if (!currentVersionId) throw validation("versionId requerido");
    await svc.updateVersion(u.id, {
      currentVersionId,
      modelId: parsed.data.modelId,
      newVersionId: parsed.data.newVersionId,
    });
    res.json(ok({ versionId: parsed.data.newVersionId, updated: true }));
  }),

  remove: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    const versionId = req.params.versionId ?? "";
    if (!versionId) throw validation("versionId requerido");
    await svc.remove(u.id, versionId);
    res.json(ok({ removed: true }));
  }),
};