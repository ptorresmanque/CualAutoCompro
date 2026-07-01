import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { listModelsQuerySchema } from "./models.dto.js";

export class ModelsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(q: z.infer<typeof listModelsQuerySchema>) {
    const where: Prisma.ModelWhereInput = {};
    if (q.brand) where.brandId = q.brand;
    if (q.segment) where.segment = q.segment;

    const vWhere: Prisma.VersionWhereInput = {};
    if (q.transmission) vWhere.transmission = q.transmission;
    if (q.fuel) vWhere.fuel = q.fuel;
    if (q.year !== undefined) vWhere.year = q.year;
    if (q.priceMin !== undefined || q.priceMax !== undefined) {
      vWhere.priceClp = {
        ...(q.priceMin !== undefined ? { gte: q.priceMin } : {}),
        ...(q.priceMax !== undefined ? { lte: q.priceMax } : {}),
      };
    }
    if (q.powerMin !== undefined) vWhere.powerHp = { gte: q.powerMin };
    if (q.consumptionMax !== undefined) vWhere.consumptionCityKmL = { lte: q.consumptionMax };

    if (Object.keys(vWhere).length > 0) where.versions = { some: vWhere };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.model.count({ where }),
      this.prisma.model.findMany({
        where,
        include: { brand: true, versions: { orderBy: { priceClp: "asc" } } },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { name: "asc" },
      }),
    ]);

    const enriched = items.map((m) => {
      const prices = m.versions.map((v) => v.priceClp);
      const consumptions = m.versions
        .map((v) => v.consumptionCityKmL)
        .filter((c): c is number => typeof c === "number");
      const minPrice = prices.length ? Math.min(...prices) : null;
      const minConsumption = consumptions.length ? Math.min(...consumptions) : null;
      const maxPrice = prices.length ? Math.max(...prices) : null;
      const firstVersion = m.versions[0];
      const defaultVersion = firstVersion
        ? {
            id: firstVersion.id,
            name: firstVersion.name,
            priceClp: firstVersion.priceClp,
            year: firstVersion.year,
          }
        : null;
      const versions = m.versions.map((v) => ({
        id: v.id,
        name: v.name,
        year: v.year,
        priceClp: v.priceClp,
        transmission: v.transmission,
        fuel: v.fuel,
        engineDisplacementCc: v.engineDisplacementCc,
        powerHp: v.powerHp,
        torqueNm: v.torqueNm,
        consumptionCityKmL: v.consumptionCityKmL,
        consumptionHighwayKmL: v.consumptionHighwayKmL,
      }));
      return {
        id: m.id, brandId: m.brandId, name: m.name, segment: m.segment,
        imageUrl: m.galleryUrls[0] ?? m.imageUrl ?? null,
        galleryUrls: m.galleryUrls, brand: m.brand,
        minPrice, minConsumption, maxPrice, versionCount: m.versions.length,
        defaultVersion,
        versions,
      };
    });

    enriched.sort((a, b) => {
      const dir = q.order === "desc" ? -1 : 1;
      let cmp = 0;
      if (q.sort === "minPrice") {
        cmp = ((a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
      } else if (q.sort === "minConsumption") {
        cmp = ((a.minConsumption ?? Infinity) - (b.minConsumption ?? Infinity));
      } else {
        cmp = a.name.localeCompare(b.name);
      }
      return cmp * dir;
    });

    return { total, items: enriched, page: q.page, pageSize: q.pageSize };
  }
}