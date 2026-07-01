import type { PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
export class VersionsService {
  constructor(private readonly prisma: PrismaClient) {}
  async detail(id: string) {
    const v = await this.prisma.version.findFirst({
      where: { id, deletedAt: null },
      include: {
        model: { include: { brand: true } },
        equipmentItems: { include: { equipmentItem: true } },
        maintenanceCosts: { where: { deletedAt: null } },
      },
    });
    if (!v) throw notFound("Versión no encontrada");
    return v;
  }
}
