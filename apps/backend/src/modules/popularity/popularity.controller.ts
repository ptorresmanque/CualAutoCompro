import { z } from "zod";
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { validation } from "../../shared/errors.js";
import { prisma } from "../../infra/prisma.js";
import { PopularityService } from "./popularity.service.js";
import { ensurePopularityCookie } from "./popularity-cookie.js";
import { isPopularityRateLimited } from "./popularity-rate-limit.js";

const svc = new PopularityService(prisma);

const recordSchema = z.object({ versionId: z.string().min(1).max(64) });

export const popularityController = {
  /** POST /popular/events  (publico, rate-limited, anonimo via cookie) */
  record: ah(async (req: Request, res: Response) => {
    if (isPopularityRateLimited(`popular:${req.ip ?? "unknown"}`)) {
      // 429 Too Many Requests. Responder igual con un codigo consistente.
      res.status(429);
      return res.json({
        data: null,
        error: { code: "TOO_MANY_REQUESTS", message: "Demasiadas solicitudes, intenta en un momento." },
      });
    }
    const parsed = recordSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw validation("versionId requerido", parsed.error.issues);

    // Antes de validar: asegurar cookie (siempre). Asi el primer POST
    // tambien queda deduplicado para el siguiente click del mismo browser.
    const cookieId = ensurePopularityCookie(req, res);

    await svc.recordAdd({ versionId: parsed.data.versionId, cookieId });
    res.status(204).end();
  }),

  /** GET /popular/models  (publico) */
  top: ah(async (_req: Request, res: Response) => {
    res.json(ok({ ids: await svc.getTopModelIds() }));
  }),
};
