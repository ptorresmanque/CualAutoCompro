import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { badRequest } from "../../shared/errors.js";

const TEMPLATES: Record<string, unknown> = {
  brand: { name: "", logoUrl: null },
  model: { brandId: "", name: "", segment: "SEDAN", imageUrl: null, galleryUrls: [] },
  version: {
    modelId: "",
    name: "",
    year: 2026,
    priceClp: 0,
    transmission: "MANUAL",
    fuel: "BENCINA",
    engineDisplacementCc: 0,
    powerHp: 0,
    torqueNm: 0,
    consumptionCityKmL: 0,
    consumptionHighwayKmL: 0,
    lengthMm: 0,
    widthMm: 0,
    heightMm: 0,
    weightKg: 0,
    trunkLiters: 0,
    airbagCount: 0,
    hasAbs: false,
    hasEsp: false,
    hasCruiseControl: false,
  },
  equipment: { name: "", category: "" },
  maintenance: { versionId: "", mileageTag: 0, costClp: 0 },
};

export const seedController = {
  template: ah(async (req: Request, res: Response) => {
    const entity = req.params.entity ?? "";
    const tpl = TEMPLATES[entity];
    if (!tpl) throw badRequest(`Entity '${entity}' no soportada. Soportadas: ${Object.keys(TEMPLATES).join(", ")}`);
    res.json(ok(tpl));
  }),
};