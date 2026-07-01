import type { PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";

export interface FavoriteModelCard {
  id: string;
  name: string;
  segment: string;
  brand: { id: string; name: string };
  imageUrl: string | null;
  minPrice: number | null;
  defaultVersion: { id: string; name: string; priceClp: number; year: number } | null;
  versions: Array<{
    id: string;
    name: string;
    year: number;
    priceClp: number;
    transmission: string | null;
    fuel: string | null;
    engineDisplacementCc: number | null;
    powerHp: number | null;
    torqueNm: number | null;
    consumptionCityKmL: number | null;
    consumptionHighwayKmL: number | null;
  }>;
}

export class FavoritesService {
  constructor(private readonly prisma: PrismaClient) {}

  async listIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      select: { modelId: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => r.modelId);
  }

  async listModels(userId: string): Promise<FavoriteModelCard[]> {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        model: {
          include: {
            brand: true,
            versions: { orderBy: { priceClp: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return favs.map((f) => this.toCard(f.model));
  }

  async add(userId: string, modelId: string): Promise<{ created: boolean }> {
    const model = await this.prisma.model.findUnique({ where: { id: modelId } });
    if (!model) throw notFound("Modelo no encontrado");
    try {
      await this.prisma.favorite.create({ data: { userId, modelId } });
      return { created: true };
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === "P2002") return { created: false };
      throw e;
    }
  }

  async remove(userId: string, modelId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, modelId } });
  }

  private toCard(m: {
    id: string;
    name: string;
    segment: string;
    imageUrl: string | null;
    galleryUrls: string[];
    brand: { id: string; name: string };
    versions: Array<{
      id: string;
      name: string;
      year: number;
      priceClp: number;
      transmission: string;
      fuel: string;
      engineDisplacementCc: number;
      powerHp: number;
      torqueNm: number;
      consumptionCityKmL: number;
      consumptionHighwayKmL: number;
    }>;
  }): FavoriteModelCard {
    const prices = m.versions.map((v) => v.priceClp);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const firstVersion = m.versions[0];
    return {
      id: m.id,
      name: m.name,
      segment: m.segment,
      brand: { id: m.brand.id, name: m.brand.name },
      imageUrl: m.galleryUrls[0] ?? m.imageUrl ?? null,
      minPrice,
      defaultVersion: firstVersion
        ? { id: firstVersion.id, name: firstVersion.name, priceClp: firstVersion.priceClp, year: firstVersion.year }
        : null,
      versions: m.versions.map((v) => ({
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
      })),
    };
  }
}
