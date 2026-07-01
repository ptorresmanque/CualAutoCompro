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
      where: { id: { in: versionIds }, deletedAt: null, model: { deletedAt: null } },
      include: {
        model: {
          include: {
            brand: true,
            versions: { where: { deletedAt: null }, orderBy: { priceClp: "asc" } },
          },
        },
        maintenanceCosts: { where: { deletedAt: null } },
      },
    });
    if (versions.length !== versionIds.length) throw notFound("Alguna versión no existe");

    const enriched = versions.map((v) => ({
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
            })),
          }
        : undefined,
    }));

    if (enriched.length === 1) {
      return {
        versions: enriched,
        diffHighlights: Object.fromEntries(DIFF_KEYS.map((k) => [k, false])),
      };
    }
    const first = enriched[0]!;
    const diffHighlights: Record<string, boolean> = {};
    for (const key of DIFF_KEYS) {
      diffHighlights[key] = enriched.some(
        (v) => v[key as keyof typeof v] !== first[key as keyof typeof first],
      );
    }
    return { versions: enriched, diffHighlights };
  }
}