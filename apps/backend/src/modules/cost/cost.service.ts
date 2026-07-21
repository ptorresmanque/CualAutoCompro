import type { PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";

export type CostBreakdown = {
  kmPerYear: number;
  fuelClp: number;
  maintenanceClp: number;
  circulationPermitClp: number;
  mandatoryInsuranceClp: number;
  voluntaryInsuranceClp: number;
  depreciationClp: number;
  totalClp: number;
  meta: {
    consumptionCityKmL: number | null;
    consumptionHighwayKmL: number | null;
    fuelType: string | null;
    fuelUnit: string | null;
    fuelPricePerUnit: number | null;
    cityShare: number;
    highwayShare: number;
    maintenanceMileages: number[];
  };
};

const DEFAULT_CITY_SHARE = 0.33;
const DEFAULT_HIGHWAY_SHARE = 1 - DEFAULT_CITY_SHARE;
const ANNUAL_DEPRECIATION_RATE = 0.1;
const MAX_KM_PER_YEAR = 200_000;

const round = (n: number): number => Math.round(n);

export class CostService {
  constructor(private readonly prisma: PrismaClient) {}

  async calculate(versionId: string, kmPerYear: number): Promise<CostBreakdown> {
    const safeKm = Math.max(0, Math.min(kmPerYear, MAX_KM_PER_YEAR));
    const version = await this.prisma.version.findFirst({
      where: { id: versionId, deletedAt: null },
    });
    if (!version) throw notFound("Versión no encontrada");

    const fuelPrice = await this.prisma.fuelPrice.findFirst({
      where: { fuelType: version.fuel, deletedAt: null },
      orderBy: { effectiveFrom: "desc" },
    });

    const cityKm = safeKm * DEFAULT_CITY_SHARE;
    const hwKm = safeKm * DEFAULT_HIGHWAY_SHARE;
    let fuelClp = 0;
    let fuelPricePerUnit: number | null = null;
    let fuelUnit: string | null = null;
    if (fuelPrice && version.consumptionCityKmL > 0 && version.consumptionHighwayKmL > 0) {
      const pricePerLiter = fuelPrice.pricePerUnitClp;
      const liters = cityKm / version.consumptionCityKmL + hwKm / version.consumptionHighwayKmL;
      fuelClp = round(liters * pricePerLiter);
      fuelPricePerUnit = pricePerLiter;
      fuelUnit = fuelPrice.unit;
    }

    const maintenanceRows = await this.prisma.maintenanceCost.findMany({
      where: { versionId, deletedAt: null, mileageTag: { lte: safeKm } },
      orderBy: { mileageTag: "asc" },
    });
    const maintenanceClp = maintenanceRows.reduce((sum, m) => sum + m.costClp, 0);

    const circulationPermitClp = version.circulationPermitClp ?? 0;
    const mandatoryInsuranceClp = version.mandatoryInsuranceClp ?? 0;
    const voluntaryInsuranceClp = version.voluntaryInsuranceClp ?? 0;
    const depreciationClp = round(version.priceClp * ANNUAL_DEPRECIATION_RATE);

    const totalClp =
      fuelClp +
      maintenanceClp +
      circulationPermitClp +
      mandatoryInsuranceClp +
      voluntaryInsuranceClp +
      depreciationClp;

    return {
      kmPerYear: safeKm,
      fuelClp,
      maintenanceClp,
      circulationPermitClp,
      mandatoryInsuranceClp,
      voluntaryInsuranceClp,
      depreciationClp,
      totalClp,
      meta: {
        consumptionCityKmL: version.consumptionCityKmL || null,
        consumptionHighwayKmL: version.consumptionHighwayKmL || null,
        fuelType: version.fuel,
        fuelUnit,
        fuelPricePerUnit,
        cityShare: DEFAULT_CITY_SHARE,
        highwayShare: DEFAULT_HIGHWAY_SHARE,
        maintenanceMileages: maintenanceRows.map((m) => m.mileageTag),
      },
    };
  }
}
