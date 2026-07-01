import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateEquipmentInput, UpdateEquipmentInput } from "./equipment.dto.admin.js";

export class EquipmentService {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.equipmentItem.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async create(input: CreateEquipmentInput) {
    return this.prisma.equipmentItem.create({ data: input });
  }

  async update(id: string, input: UpdateEquipmentInput) {
    try {
      return await this.prisma.equipmentItem.update({
        where: { id, deletedAt: null },
        data: input,
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
    return this.prisma.versionEquipment.create({
      data: { versionId, equipmentItemId: itemId },
    });
  }

  async detach(versionId: string, itemId: string) {
    await this.prisma.versionEquipment.delete({
      where: { versionId_equipmentItemId: { versionId, equipmentItemId: itemId } },
    });
    return { detached: true };
  }
}