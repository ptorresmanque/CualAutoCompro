import { Prisma, type PrismaClient } from "@prisma/client";
import { conflict, notFound } from "../../shared/errors.js";
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
      orderBy: { name: "asc" },
    });
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

  async attach(versionId: string, itemId: string) {
    try {
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
}