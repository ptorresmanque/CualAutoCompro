import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { CostService } from "./cost.service.js";

const svc = new CostService(prisma);

export const costController = {
  forVersion: ah(async (req: Request, res: Response) => {
    const id = (req.params.id ?? "").trim();
    if (!id) {
      return res.status(400).json({
        data: null,
        error: { code: "BAD_REQUEST", message: "id requerido" },
      });
    }
    const kmRaw = req.query.kmPerYear;
    const parsedKm = typeof kmRaw === "string" ? Number.parseInt(kmRaw, 10) : Number(kmRaw);
    const kmPerYear = Number.isFinite(parsedKm) && parsedKm > 0 ? parsedKm : 15_000;
    res.json(ok(await svc.calculate(id, kmPerYear)));
  }),
};
