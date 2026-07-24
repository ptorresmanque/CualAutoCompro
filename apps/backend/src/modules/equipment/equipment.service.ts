import { Prisma, type PrismaClient } from "@prisma/client";
import { conflict, notFound } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import type { CreateEquipmentInput, UpdateEquipmentInput } from "./equipment.dto.admin.js";

export class EquipmentService {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.equipmentItem.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  listAll() {
    return this.prisma.equipmentItem.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Devuelve las categorías únicas existentes (sin duplicados, ordenadas).
   * Útil para precargar el autocomplete del formulario de equipamiento.
   *
   * Devuelve objetos `{ id, name }` para ser compatible con `app-select-search`
   * que consume endpoints `optionsApi` cuya respuesta es una lista de items
   * con esos dos campos. `id` y `name` son iguales (la categoría en sí) y al
   * hacer `pick()` se guarda el id como valor del form control.
   */
  async listCategories(): Promise<Array<{ id: string; name: string }>> {
    const groups = await this.prisma.equipmentItem.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: { _all: true },
      orderBy: { category: "asc" },
    });
    return groups.map((g) => ({ id: g.category, name: g.category }));
  }

  async listPaged(q: string | undefined, params: PaginationParams) {
    const where: Prisma.EquipmentItemWhereInput = { deletedAt: null };
    if (q) {
      const term = q.trim();
      if (term.length > 0) where.name = { contains: term };
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.equipmentItem.findMany({
        where,
        orderBy: { name: "asc" },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.equipmentItem.count({ where }),
    ]);
    return { rows, total };
  }

  async create(input: CreateEquipmentInput) {
    return this.prisma.equipmentItem.create({ data: input as Prisma.EquipmentItemCreateInput });
  }

  async update(id: string, input: UpdateEquipmentInput) {
    const data = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Prisma.EquipmentItemUpdateInput;
    try {
      return await this.prisma.equipmentItem.update({
        where: { id, deletedAt: null },
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Equipment item no encontrado");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      const attachedVersions = await this.prisma.versionEquipment.count({
        where: { equipmentItemId: id, version: { deletedAt: null } },
      });
      if (attachedVersions > 0) {
        throw conflict("No se puede eliminar: el equipamiento está asociado a versiones", {
          code: "EQUIPMENT_IN_USE",
          versionCount: attachedVersions,
        });
      }
      await this.prisma.equipmentItem.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Equipment item no encontrado");
      }
      throw e;
    }
  }

  async restore(id: string) {
    try {
      return await this.prisma.equipmentItem.update({
        where: { id },
        data: { deletedAt: null },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Equipment item no encontrado");
      }
      throw e;
    }
  }

  async attach(versionId: string, itemId: string) {
    try {
      const [version, item] = await Promise.all([
        this.prisma.version.findFirst({
          where: { id: versionId, deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } },
          select: { id: true },
        }),
        this.prisma.equipmentItem.findFirst({
          where: { id: itemId, deletedAt: null },
          select: { id: true },
        }),
      ]);
      if (!version) throw notFound("Versión no encontrada");
      if (!item) throw notFound("Equipamiento no encontrado");
      return await this.prisma.versionEquipment.create({
        data: { versionId, equipmentItemId: itemId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw conflict("El equipamiento ya está asociado a esta versión", {
          code: "EQUIPMENT_ALREADY_ATTACHED",
        });
      }
      throw e;
    }
  }

  async detach(versionId: string, itemId: string) {
    try {
      await this.prisma.versionEquipment.delete({
        where: { versionId_equipmentItemId: { versionId, equipmentItemId: itemId } },
      });
      return { detached: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Asociación no encontrada");
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
