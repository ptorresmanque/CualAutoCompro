import { Prisma, type PrismaClient } from "@prisma/client";
import { conflict, notFound } from "../../shared/errors.js";
import { toGalleryUrls } from "../../shared/json.js";
import type { PaginationParams } from "../../shared/pagination.js";
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

  async listPaged(q: string | undefined, params: PaginationParams) {
    const where: Prisma.BrandWhereInput = { deletedAt: null };
    if (q) {
      where.name = { contains: q };
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.brand.findMany({
        where,
        orderBy: { name: "asc" },
        skip: params.skip,
        take: params.take,
        include: {
          dealers: { include: { dealer: { select: { id: true, name: true, url: true, logoUrl: true } } } },
        },
      }),
      this.prisma.brand.count({ where }),
    ]);
    return { rows, total };
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
      return await this.prisma.$transaction(async (tx) => {
        const brand = await tx.brand.update({
          where: { id, deletedAt: null },
          data,
        });
        if (dealerIds !== undefined) {
          const uniqueDealerIds = [...new Set(dealerIds)];
          const activeDealerCount = await tx.dealer.count({
            where: { id: { in: uniqueDealerIds }, deletedAt: null },
          });
          if (activeDealerCount !== uniqueDealerIds.length) {
            throw notFound("Uno o más concesionarios no existen o están eliminados");
          }
          await tx.brandDealer.deleteMany({ where: { brandId: id } });
          if (uniqueDealerIds.length > 0) {
            await tx.brandDealer.createMany({
              data: uniqueDealerIds.map((dealerId) => ({ brandId: id, dealerId })),
            });
          }
        }
        return brand;
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

  async restore(id: string) {
    try {
      return await this.prisma.brand.update({
        where: { id },
        data: { deletedAt: null },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Marca no encontrada");
      }
      throw e;
    }
  }

  async bulkDelete(ids: string[]) {
    const failed: Array<{ id: string; reason: string }> = [];
    let deleted = 0;
    for (const id of ids) {
      try {
        await this.softDelete(id);
        deleted += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        failed.push({ id, reason: msg });
      }
    }
    return { deleted, failed };
  }
}
