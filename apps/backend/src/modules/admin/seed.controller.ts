import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { badRequest } from "../../shared/errors.js";

const TEMPLATES: Record<string, unknown> = {
  brand: { name: "", logoUrl: null },
  model: { brandId: "", name: "", segment: "SEDAN", imageUrl: null, galleryUrls: [] },
  // Sin `year`: lo pone el servidor (ver shared/model-year.ts). Si estuviera
  // acá, el diálogo admin lo renderizaría como campo extra.
  version: {
    modelId: "",
    name: "",
    priceClp: 0,
    transmission: "MANUAL",
    fuel: "BENCINA",
    traction: "TRACTION_FRONT",
    engineType: "ENGINE_NA",
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
    circulationPermitClp: null,
    mandatoryInsuranceClp: null,
    voluntaryInsuranceClp: null,
    fuelTankLiters: null,
    batteryCapacityKwh: null,
    hasRecall: false,
    recallUrl: null,
  },
  equipment: { name: "", category: "" },
  maintenance: { versionId: "", mileageTag: 0, costClp: 0 },
  dealer: { name: "", url: "", logoUrl: null },
  fuelPrice: { fuelType: "BENCINA", pricePerUnitClp: 0, unit: "L" },
  color: { name: "", hex: null },
};

export const seedController = {
  template: ah(async (req: Request, res: Response) => {
    const entity = req.params.entity ?? "";
    const tpl = TEMPLATES[entity];
    if (!tpl) throw badRequest(`Entity '${entity}' no soportada. Soportadas: ${Object.keys(TEMPLATES).join(", ")}`);
    res.json(ok(tpl));
  }),
};
