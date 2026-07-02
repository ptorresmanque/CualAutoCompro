import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateMaintenanceInput, UpdateMaintenanceInput } from "./maintenance.dto.admin.js";

export class MaintenanceService {
  constructor(private readonly prisma: PrismaClient) {}

  listByVersion(versionId: string) {
    return this.prisma.maintenanceCost.findMany({
      where: { versionId, deletedAt: null },
      orderBy: { mileageTag: "asc" },
    });
  }

  listAll() {
    return this.prisma.maintenanceCost.findMany({
      where: {
        deletedAt: null,
        version: { deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } },
      },
      orderBy: [{ versionId: "asc" }, { mileageTag: "asc" }],
    });
  }

  listAllPublic() {
    return this.prisma.maintenanceCost.findMany({
      where: {
        deletedAt: null,
        version: { deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } },
      },
      orderBy: [{ versionId: "asc" }, { mileageTag: "asc" }],
      select: { id: true, versionId: true, mileageTag: true, costClp: true },
    });
  }

  async create(input: CreateMaintenanceInput) {
    return this.prisma.maintenanceCost.create({
      data: input as Prisma.MaintenanceCostUncheckedCreateInput,
    });
  }

  async update(id: string, input: UpdateMaintenanceInput) {
    const data = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Prisma.MaintenanceCostUpdateInput;
    try {
      return await this.prisma.maintenanceCost.update({
        where: { id, deletedAt: null },
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Maintenance cost no encontrado");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      await this.prisma.maintenanceCost.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Maintenance cost no encontrado");
      }
      throw e;
    }
  }
}