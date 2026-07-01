import { Prisma, type PrismaClient } from "@prisma/client";
import { conflict, notFound } from "../../shared/errors.js";
import type { CreateBrandInput, UpdateBrandInput } from "./brands.dto.admin.js";

export class BrandsService {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  models(brandId: string) {
    return this.prisma.model.findMany({
      where: { brandId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async create(input: CreateBrandInput) {
    return this.prisma.brand.create({ data: input as Prisma.BrandCreateInput });
  }

  async update(id: string, input: UpdateBrandInput) {
    const data = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Prisma.BrandUpdateInput;
    try {
      return await this.prisma.brand.update({
        where: { id, deletedAt: null },
        data,
      });
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
