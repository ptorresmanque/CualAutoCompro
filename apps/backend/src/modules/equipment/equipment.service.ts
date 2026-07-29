import { Prisma, type PrismaClient } from "@prisma/client";
import { conflict, notFound } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { inheritedEquipmentIds } from "../../shared/effective-equipment.js";
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
      const [versionCount, brandCount, modelCount] = await Promise.all([
        this.prisma.versionEquipment.count({
          where: { equipmentItemId: id, version: { deletedAt: null } },
        }),
        this.prisma.brandEquipment.count({
          where: { equipmentItemId: id, brand: { deletedAt: null } },
        }),
        this.prisma.modelEquipment.count({
          where: { equipmentItemId: id, model: { deletedAt: null } },
        }),
      ]);
      if (versionCount > 0 || brandCount > 0 || modelCount > 0) {
        const targets = [
          versionCount > 0 ? "versiones" : null,
          modelCount > 0 ? "modelos" : null,
          brandCount > 0 ? "marcas" : null,
        ].filter((t): t is string => t !== null);
        throw conflict(`No se puede eliminar: el equipamiento está asociado a ${targets.join(", ")}`, {
          code: "EQUIPMENT_IN_USE",
          versionCount,
          brandCount,
          modelCount,
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

  /**
   * Deja la versión con exactamente `itemIds` como equipamiento **efectivo**,
   * en una transacción. A diferencia de `attach`, es idempotente: reenviar la
   * misma selección no produce 409. El admin manda la selección completa y el
   * diff se calcula acá, en vez de emitir un request por ítem desde el navegador.
   *
   * `itemIds` incluye lo heredado de la marca y del modelo, porque el formulario
   * muestra una sola lista. La derivación:
   *
   *   propio     = (deseado − heredado) ∪ (deseado ∩ propio actual)
   *   exclusión  = heredado − deseado
   *
   * El segundo término de `propio` preserva un ítem que ya era propio de la
   * versión aunque después la marca lo haya agregado también: sin eso, quitarlo
   * de la marca lo borraría de una versión que lo tenía cargado a mano.
   */
  async syncVersion(versionId: string, itemIds: string[]) {
    const desired = new Set(itemIds);

    const version = await this.prisma.version.findFirst({
      where: { id: versionId, deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } },
      select: { id: true, modelId: true, model: { select: { brandId: true } } },
    });
    if (!version) throw notFound("Versión no encontrada");

    await this.assertItemsExist(desired);

    const [inherited, current] = await Promise.all([
      inheritedEquipmentIds(this.prisma, version.modelId, version.model.brandId),
      this.prisma.versionEquipment.findMany({
        where: { versionId },
        select: { equipmentItemId: true },
      }),
    ]);
    const currentOwn = new Set(current.map((r) => r.equipmentItemId));

    const nextOwn = new Set(
      [...desired].filter((id) => !inherited.has(id) || currentOwn.has(id)),
    );
    const toAttach = [...nextOwn].filter((id) => !currentOwn.has(id));
    const toDetach = [...currentOwn].filter((id) => !nextOwn.has(id));

    // Solo se tocan las exclusiones de ítems que hoy se heredan: si un ítem
    // dejó de estar en la marca, su exclusión queda intacta para que siga
    // valiendo si la marca vuelve a agregarlo.
    const toExclude = [...inherited].filter((id) => !desired.has(id));
    const toUnexclude = [...inherited].filter((id) => desired.has(id));

    await this.prisma.$transaction([
      this.prisma.versionEquipment.deleteMany({
        where: { versionId, equipmentItemId: { in: toDetach } },
      }),
      this.prisma.versionEquipment.createMany({
        data: toAttach.map((equipmentItemId) => ({ versionId, equipmentItemId })),
      }),
      this.prisma.versionEquipmentExclusion.deleteMany({
        where: { versionId, equipmentItemId: { in: toUnexclude } },
      }),
      this.prisma.versionEquipmentExclusion.createMany({
        data: toExclude.map((equipmentItemId) => ({ versionId, equipmentItemId })),
        skipDuplicates: true,
      }),
    ]);

    return { attached: toAttach.length, detached: toDetach.length, excluded: toExclude.length };
  }

  /**
   * Deja la marca con exactamente `itemIds` como equipamiento de serie. Todas
   * sus versiones —existentes y futuras— lo heredan; la herencia se resuelve al
   * leer, así que no hay nada que propagar. Ver `shared/effective-equipment.ts`.
   */
  async syncBrand(brandId: string, itemIds: string[]) {
    const brand = await this.prisma.brand.findFirst({
      where: { id: brandId, deletedAt: null },
      select: { id: true },
    });
    if (!brand) throw notFound("Marca no encontrada");

    const nextIds = new Set(itemIds);
    await this.assertItemsExist(nextIds);

    const current = await this.prisma.brandEquipment.findMany({
      where: { brandId },
      select: { equipmentItemId: true },
    });
    const currentIds = new Set(current.map((r) => r.equipmentItemId));
    const toAttach = [...nextIds].filter((id) => !currentIds.has(id));
    const toDetach = [...currentIds].filter((id) => !nextIds.has(id));

    await this.prisma.$transaction([
      this.prisma.brandEquipment.deleteMany({
        where: { brandId, equipmentItemId: { in: toDetach } },
      }),
      this.prisma.brandEquipment.createMany({
        data: toAttach.map((equipmentItemId) => ({ brandId, equipmentItemId })),
      }),
    ]);

    return { attached: toAttach.length, detached: toDetach.length };
  }

  /** Igual que `syncBrand`, a nivel de modelo. */
  async syncModel(modelId: string, itemIds: string[]) {
    const model = await this.prisma.model.findFirst({
      where: { id: modelId, deletedAt: null, brand: { deletedAt: null } },
      select: { id: true },
    });
    if (!model) throw notFound("Modelo no encontrado");

    const nextIds = new Set(itemIds);
    await this.assertItemsExist(nextIds);

    const current = await this.prisma.modelEquipment.findMany({
      where: { modelId },
      select: { equipmentItemId: true },
    });
    const currentIds = new Set(current.map((r) => r.equipmentItemId));
    const toAttach = [...nextIds].filter((id) => !currentIds.has(id));
    const toDetach = [...currentIds].filter((id) => !nextIds.has(id));

    await this.prisma.$transaction([
      this.prisma.modelEquipment.deleteMany({
        where: { modelId, equipmentItemId: { in: toDetach } },
      }),
      this.prisma.modelEquipment.createMany({
        data: toAttach.map((equipmentItemId) => ({ modelId, equipmentItemId })),
      }),
    ]);

    return { attached: toAttach.length, detached: toDetach.length };
  }

  private async assertItemsExist(ids: Set<string>): Promise<void> {
    if (ids.size === 0) return;
    const valid = await this.prisma.equipmentItem.findMany({
      where: { id: { in: [...ids] }, deletedAt: null },
      select: { id: true },
    });
    if (valid.length !== ids.size) throw notFound("Equipamiento no encontrado");
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
