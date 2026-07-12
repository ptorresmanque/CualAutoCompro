import { z } from "zod";
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { ComparisonsService } from "./comparisons.service.js";
import { unauthorized, validation } from "../../shared/errors.js";

const svc = new ComparisonsService(prisma);
const createSchema = z.object({ versionIds: z.array(z.string()).min(1).max(3), name: z.string().max(80).optional() });

export const comparisonsController = {
  bySlug: ah(async (req: Request, res: Response) => {
    const slug = req.params.slug ?? "";
    res.json(ok(await svc.getBySlug(slug)));
  }),

  listMine: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    res.json(ok(await svc.listByUser(u.id)));
  }),

  createMine: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    const opts: { userId: string; versionIds: string[]; name?: string } = { userId: u.id, versionIds: parsed.data.versionIds };
    if (parsed.data.name !== undefined) opts.name = parsed.data.name;
    res.json(ok(await svc.create(opts)));
  }),

  deleteMine: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    const id = req.params.id ?? "";
    await svc.delete(id, u.id);
    res.json(ok({ deleted: true }));
  }),
};
