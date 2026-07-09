import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateFuelPriceInput } from "./fuel-prices.dto.admin.js";

export class FuelPricesService {
  constructor(private readonly prisma: PrismaClient) {}

  listAll() {
    return this.prisma.fuelPrice.findMany({
      where: { deletedAt: null },
      orderBy: [{ fuelType: "asc" }, { effectiveFrom: "desc" }],
    });
  }

  async current() {
    // Para cada fuelType, retorna la fila con effectiveFrom más reciente y deletedAt null.
    const fuelTypes = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;
    const out: { fuelType: string; pricePerUnitClp: number; unit: string; effectiveFrom: Date }[] = [];
    for (const fuelType of fuelTypes) {
      const row = await this.prisma.fuelPrice.findFirst({
        where: { fuelType, deletedAt: null },
        orderBy: { effectiveFrom: "desc" },
      });
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
}
