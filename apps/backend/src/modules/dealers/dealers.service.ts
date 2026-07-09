import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateDealerInput, UpdateDealerInput } from "./dealers.dto.admin.js";

export class DealersService {
  constructor(private readonly prisma: PrismaClient) {}

  listAll() {
    return this.prisma.dealer.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
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
}