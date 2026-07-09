import { Prisma, type PrismaClient } from "@prisma/client";
import { conflict, notFound } from "../../shared/errors.js";
import { toGalleryUrls } from "../../shared/json.js";
import type { CreateBrandInput, UpdateBrandInput } from "./brands.dto.admin.js";

export class BrandsService {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  listAll() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        dealers: { include: { dealer: { select: { id: true, name: true, url: true, logoUrl: true } } } },
      },
    });
  }

  models(brandId: string) {
    return this.prisma.model.findMany({
      where: { brandId, deletedAt: null },
      orderBy: { name: "asc" },
    }).then((rows) => rows.map((m) => ({ ...m, galleryUrls: toGalleryUrls(m.galleryUrls) })));
  }

  async create(input: CreateBrandInput) {
    return this.prisma.brand.create({ data: input as Prisma.BrandCreateInput });
  }

  async update(id: string, input: UpdateBrandInput) {
    const { dealerIds, ...rest } = input;
    const data = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    ) as Prisma.BrandUpdateInput;
    try {
      const brand = await this.prisma.brand.update({
        where: { id, deletedAt: null },
        data,
      });
      if (dealerIds !== undefined) {
        await this.prisma.brandDealer.deleteMany({ where: { brandId: id } });
        if (dealerIds.length > 0) {
          await this.prisma.brandDealer.createMany({
            data: dealerIds.map((dealerId) => ({ brandId: id, dealerId })),
          });
        }
      }
      return brand;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Marca no encontrada");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    const count = await this.prisma.model.count({
      where: { brandId: id, deletedAt: null },
    });
    if (count > 0) {
      throw conflict("No se puede eliminar: tiene modelos asociados", {
        code: "BRAND_HAS_MODELS",
        modelCount: count,
      });
    }
    await this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }
}
