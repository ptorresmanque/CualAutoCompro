import { z } from "zod";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { CompareService } from "./compare.service.js";
import { validation } from "../../shared/errors.js";

const postBodySchema = z.object({
  versionIds: z.array(z.string()).min(1).max(3),
});

const svc = new CompareService(prisma);

export const compareController = {
  post: ah(async (req, res) => {
    const parsed = postBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.compare(parsed.data.versionIds)));
  }),
  get: ah(async (req, res) => {
    const ids = String(req.query.ids ?? "").split(",").filter(Boolean);
    if (ids.length < 1) throw validation("ids requerido");
    res.json(ok(await svc.compare(ids)));
  }),
};
