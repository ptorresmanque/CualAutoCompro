import type { PrismaClient } from "@prisma/client";
import { badRequest, notFound } from "../../shared/errors.js";
import type { FuelPricesService } from "../fuel-prices/fuel-prices.service.js";

const DIFF_KEYS = [
  "priceClp","year","transmission","fuel","traction","engineType","engineDisplacementCc","powerHp","torqueNm",
  "consumptionCityKmL","consumptionHighwayKmL","lengthMm","widthMm","heightMm",
  "weightKg","trunkLiters",
  "circulationPermitClp","mandatoryInsuranceClp","voluntaryInsuranceClp","computedFillCostClp",
] as const;

type DiffKey = typeof DIFF_KEYS[number];

export class CompareService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly fuelPriceService: FuelPricesService,
  ) {}

  async compare(versionIds: string[]) {
    if (versionIds.length < 1 || versionIds.length > 3) throw badRequest("Compara entre 1 y 3 versiones");
    const versions = await this.prisma.version.findMany({
      where: { id: { in: versionIds }, deletedAt: null, model: { deletedAt: null } },
      include: {
        model: {
          include: {
            brand: true,
            versions: { where: { deletedAt: null }, orderBy: { priceClp: "asc" } },
          },
        },
        maintenanceCosts: { where: { deletedAt: null } },
        equipmentItems: {
          include: { equipmentItem: { select: { id: true, name: true, category: true } } },
        },
      },
    });
    if (versions.length !== versionIds.length) throw notFound("Alguna versión no existe");

    const fuelPrices = await this.fuelPriceService.current();
    const priceByFuelType = new Map(fuelPrices.map((fp) => [fp.fuelType, fp]));

    const enriched = versions.map((v) => {
      const fillCost = this.computeFillCost(v, priceByFuelType);
      return {
        ...v,
        model: v.model
          ? {
              ...v.model,
              availableVersions: v.model.versions.map((av) => ({
                id: av.id,
                name: av.name,
                year: av.year,
                priceClp: av.priceClp,
                transmission: av.transmission,
                fuel: av.fuel,
                traction: av.traction,
                engineType: av.engineType,
              })),
            }
          : undefined,
        computedFillCostClp: fillCost,
      };
    });

    const diffHighlights: Partial<Record<DiffKey, boolean>> = {};
    if (enriched.length === 1) {
      for (const k of DIFF_KEYS) diffHighlights[k] = false;
    } else {
      const first = enriched[0]!;
      for (const key of DIFF_KEYS) {
        diffHighlights[key] = enriched.some(
          (v) => v[key as keyof typeof v] !== first[key as keyof typeof first],
        );
      }
    }

    return { versions: enriched, diffHighlights, fuelPrices };
  }

  private computeFillCost(
    v: { fuel: string; batteryCapacityKwh: number | null; fuelTankLiters: number | null },
    prices: Map<string, { pricePerUnitClp: number; unit: string }>,
  ): number | null {
    if (v.fuel === "ELECTRIC" && v.batteryCapacityKwh != null) {
      const price = prices.get("ELECTRIC");
      return price ? v.batteryCapacityKwh * price.pricePerUnitClp : null;
    }
    if (v.fuelTankLiters != null) {
      const price = prices.get(v.fuel);
      return price ? v.fuelTankLiters * price.pricePerUnitClp : null;
    }
    return null;
  }
}
