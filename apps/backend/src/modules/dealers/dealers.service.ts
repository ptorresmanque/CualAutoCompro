import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import type { CreateDealerInput, UpdateDealerInput } from "./dealers.dto.admin.js";

export class DealersService {
  constructor(private readonly prisma: PrismaClient) {}

  listAll() {
    return this.prisma.dealer.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async listPaged(q: string | undefined, params: PaginationParams) {
    const where: Prisma.DealerWhereInput = { deletedAt: null };
    if (q) {
      const term = q.trim();
      if (term.length > 0) where.name = { contains: term };
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.dealer.findMany({
        where,
        orderBy: { name: "asc" },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.dealer.count({ where }),
    ]);
    return { rows, total };
  }

  byBrand(brandId: string) {
    return this.prisma.dealer.findMany({
      where: { deletedAt: null, brands: { some: { brandId } } },
      orderBy: { name: "asc" },
    });
  }

  async create(input: CreateDealerInput) {
    return this.prisma.dealer.create({ data: input as Prisma.DealerUncheckedCreateInput });
  }

  async update(id: string, input: UpdateDealerInput) {
    const data = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Prisma.DealerUpdateInput;
    try {
      return await this.prisma.dealer.update({
        where: { id, deletedAt: null },
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Concesionario no encontrado");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      await this.prisma.dealer.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Concesionario no encontrado");
      }
      throw e;
    }
  }

  async restore(id: string) {
    try {
      return await this.prisma.dealer.update({ where: { id }, data: { deletedAt: null } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Concesionario no encontrado");
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
