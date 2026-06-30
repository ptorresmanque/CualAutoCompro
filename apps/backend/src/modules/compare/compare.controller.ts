import { z } from "zod";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { CompareService } from "./compare.service.js";
import { validation } from "../../shared/errors.js";

const idsSchema = z.object({
  versionIds: z.array(z.string()).min(1).max(3).optional(),
  ids: z.string().optional(),
});

const svc = new CompareService(prisma);

export const compareController = {
  post: ah(async (req, res) => {
    const parsed = idsSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    if (!parsed.data.versionIds) throw validation("versionIds requerido");
    res.json(ok(await svc.compare(parsed.data.versionIds)));
  }),
  get: ah(async (req, res) => {
    const ids = String(req.query.ids ?? "").split(",").filter(Boolean);
    if (ids.length < 1) throw validation("ids requerido");
    res.json(ok(await svc.compare(ids)));
  }),
};