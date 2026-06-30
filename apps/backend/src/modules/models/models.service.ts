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
      const minPrice = prices.length ? Math.min(...prices) : null;
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
      return {
        id: m.id, brandId: m.brandId, name: m.name, segment: m.segment,
        imageUrl: m.galleryUrls[0] ?? m.imageUrl ?? null,
        galleryUrls: m.galleryUrls, brand: m.brand,
        minPrice, maxPrice, versionCount: m.versions.length,
        defaultVersion,
      };
    });

    return { total, items: enriched, page: q.page, pageSize: q.pageSize };
  }
}