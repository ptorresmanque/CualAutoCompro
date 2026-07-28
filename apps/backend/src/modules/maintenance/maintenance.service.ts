import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
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

  async listPaged(q: string | undefined, params: PaginationParams, versionId?: string) {
    const where: Prisma.MaintenanceCostWhereInput = {
      deletedAt: null,
      version: { deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } },
    };
    if (versionId) where.versionId = versionId;
    if (q) {
      const term = q.trim();
      if (term.length > 0) {
        where.OR = [
          { version: { name: { contains: term } } },
          { version: { model: { name: { contains: term } } } },
          { version: { model: { brand: { name: { contains: term } } } } },
        ];
      }
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.maintenanceCost.findMany({
        where,
        orderBy: [{ versionId: "asc" }, { mileageTag: "asc" }],
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.maintenanceCost.count({ where }),
    ]);
    return { rows, total };
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

  async restore(id: string) {
    const row = await this.prisma.maintenanceCost.findUnique({ where: { id }, select: { versionId: true } });
    if (!row) throw notFound("Maintenance cost no encontrado");
    const version = await this.prisma.version.findFirst({ where: { id: row.versionId, deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } } });
    if (!version) throw notFound("No se puede restaurar: la versión está eliminada");
    return this.prisma.maintenanceCost.update({ where: { id }, data: { deletedAt: null } });
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
