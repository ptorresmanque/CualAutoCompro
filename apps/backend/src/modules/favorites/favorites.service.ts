import type { PrismaClient } from "@prisma/client";
import { notFound, badRequest } from "../../shared/errors.js";

export interface FavoriteModelCard {
  id: string;
  name: string;
  segment: string;
  brand: { id: string; name: string };
  imageUrl: string | null;
  minPrice: number | null;
  versionId: string;
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
      select: { versionId: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => r.versionId);
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
        version: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return favs.map((f) => this.toCard(f.model, f.version.id));
  }

  async add(
    userId: string,
    args: { modelId: string; versionId: string },
  ): Promise<{ created: boolean; versionId: string }> {
    const { modelId, versionId } = args;
    const version = await this.prisma.version.findUnique({ where: { id: versionId } });
    if (!version) throw notFound("Versión no encontrada");
    if (version.modelId !== modelId) {
      throw badRequest("La versión no pertenece al modelo indicado");
    }
    try {
      await this.prisma.favorite.create({ data: { userId, modelId, versionId } });
      return { created: true, versionId };
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === "P2002") return { created: false, versionId };
      throw e;
    }
  }

  async updateVersion(
    userId: string,
    args: { currentVersionId: string; modelId: string; newVersionId: string },
  ): Promise<void> {
    const { currentVersionId, modelId, newVersionId } = args;
    if (currentVersionId === newVersionId) return;
    const newVersion = await this.prisma.version.findUnique({ where: { id: newVersionId } });
    if (!newVersion) throw notFound("Versión no encontrada");
    if (newVersion.modelId !== modelId) {
      throw badRequest("La versión no pertenece al modelo indicado");
    }
    // Eliminar el viejo y crear el nuevo (idempotente: si ya existe el nuevo,
    // el create chocará con P2002, lo atrapamos).
    await this.prisma.favorite.deleteMany({
      where: { userId, versionId: currentVersionId },
    });
    try {
      await this.prisma.favorite.create({
        data: { userId, modelId, versionId: newVersionId },
      });
    } catch (e) {
      const err = e as { code?: string };
      if (err.code !== "P2002") throw e;
      // ya existe esa versión en favoritos — noop
    }
  }

  async remove(userId: string, versionId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, versionId } });
  }

  private toCard(
    m: {
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
    },
    versionId: string,
  ): FavoriteModelCard {
    const prices = m.versions.map((v) => v.priceClp);
    const minPrice = prices.length ? Math.min(...prices) : null;
    return {
      id: m.id,
      name: m.name,
      segment: m.segment,
      brand: { id: m.brand.id, name: m.brand.name },
      imageUrl: m.galleryUrls[0] ?? m.imageUrl ?? null,
      minPrice,
      versionId,
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