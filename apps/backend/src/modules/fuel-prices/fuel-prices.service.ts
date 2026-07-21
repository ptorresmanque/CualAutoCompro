import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import type { CreateFuelPriceInput, UpdateFuelPriceInput } from "./fuel-prices.dto.admin.js";

export class FuelPricesService {
  constructor(private readonly prisma: PrismaClient) {}

  listAll() {
    return this.prisma.fuelPrice.findMany({
      where: { deletedAt: null },
      orderBy: [{ fuelType: "asc" }, { effectiveFrom: "desc" }],
    });
  }

  async listPaged(q: string | undefined, params: PaginationParams) {
    const where: Prisma.FuelPriceWhereInput = { deletedAt: null };
    if (q) {
      const term = q.trim();
      if (term.length > 0) where.fuelType = { contains: term };
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.fuelPrice.findMany({
        where,
        orderBy: [{ fuelType: "asc" }, { effectiveFrom: "desc" }],
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.fuelPrice.count({ where }),
    ]);
    return { rows, total };
  }

  async current() {
    // Para cada fuelType, retorna la fila con effectiveFrom más reciente y deletedAt null.
    const fuelTypes = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;
    const out: { fuelType: string; pricePerUnitClp: number; unit: string; effectiveFrom: Date }[] = [];
    const rows = await Promise.all(
      fuelTypes.map((fuelType) =>
        this.prisma.fuelPrice.findFirst({
          where: { fuelType, deletedAt: null },
          orderBy: { effectiveFrom: "desc" },
        }),
      ),
    );
    for (const row of rows) {
      if (row) {
        out.push({
          fuelType: row.fuelType,
          pricePerUnitClp: row.pricePerUnitClp,
          unit: row.unit,
          effectiveFrom: row.effectiveFrom,
        });
      }
    }
    return out;
  }

  async create(input: CreateFuelPriceInput) {
    return this.prisma.fuelPrice.create({
      data: input as Prisma.FuelPriceUncheckedCreateInput,
    });
  }

  async update(id: string, input: UpdateFuelPriceInput) {
    const data = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Prisma.FuelPriceUpdateInput;
    try {
      return await this.prisma.fuelPrice.update({
        where: { id, deletedAt: null },
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Precio de combustible no encontrado");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      await this.prisma.fuelPrice.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Precio de combustible no encontrado");
      }
      throw e;
    }
  }

  async restore(id: string) {
    try {
      return await this.prisma.fuelPrice.update({ where: { id }, data: { deletedAt: null } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Precio de combustible no encontrado");
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
