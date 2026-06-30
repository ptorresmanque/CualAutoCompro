import type { PrismaClient } from "@prisma/client";
import { badRequest, notFound } from "../../shared/errors.js";

const DIFF_KEYS = [
  "priceClp","year","transmission","fuel","engineDisplacementCc","powerHp","torqueNm",
  "consumptionCityKmL","consumptionHighwayKmL","lengthMm","widthMm","heightMm",
  "weightKg","trunkLiters","airbagCount","hasAbs","hasEsp","hasCruiseControl",
] as const;

export class CompareService {
  constructor(private readonly prisma: PrismaClient) {}

  async compare(versionIds: string[]) {
    if (versionIds.length < 1 || versionIds.length > 3) throw badRequest("Compara entre 1 y 3 versiones");
    const versions = await this.prisma.version.findMany({
      where: { id: { in: versionIds } },
      include: { model: { include: { brand: true } }, maintenanceCosts: true },
    });
    if (versions.length !== versionIds.length) throw notFound("Alguna versión no existe");

    if (versions.length === 1) {
      return { versions, diffHighlights: Object.fromEntries(DIFF_KEYS.map((k) => [k, false])) };
    }
    const first = versions[0]!;
    const diffHighlights: Record<string, boolean> = {};
    for (const key of DIFF_KEYS) {
      diffHighlights[key] = versions.some((v) => v[key as keyof typeof v] !== first[key as keyof typeof first]);
    }
    return { versions, diffHighlights };
  }
}