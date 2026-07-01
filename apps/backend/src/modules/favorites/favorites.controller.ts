import { z } from "zod";
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { unauthorized, validation } from "../../shared/errors.js";
import { FavoritesService } from "./favorites.service.js";

const svc = new FavoritesService(prisma);
const addSchema = z.object({ modelId: z.string().min(1) });

export const favoritesController = {
  listIds: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    res.json(ok({ modelIds: await svc.listIds(u.id) }));
  }),

  listModels: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    res.json(ok(await svc.listModels(u.id)));
  }),

  add: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    const { created } = await svc.add(u.id, parsed.data.modelId);
    res.json(ok({ modelId: parsed.data.modelId, created }));
  }),

  remove: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    const modelId = req.params.modelId ?? "";
    if (!modelId) throw validation("modelId requerido");
    await svc.remove(u.id, modelId);
    res.json(ok({ removed: true }));
  }),
};
