import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { ModelsService } from "./models.service.js";
import { listModelsQuerySchema } from "./models.dto.js";
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
    const m = await prisma.model.findUnique({
      where: { id },
      include: { brand: true, versions: { orderBy: { priceClp: "asc" } } },
    });
    if (!m) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Modelo no encontrado" } });
    res.json(ok(m));
  }),
};