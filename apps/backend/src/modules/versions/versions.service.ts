import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateVersionInput, UpdateVersionInput } from "./versions.dto.admin.js";

export class VersionsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(q: { page?: number; pageSize?: number } = {}) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 50;
    const where: Prisma.VersionWhereInput = { deletedAt: null };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.version.count({ where }),
      this.prisma.version.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { total, items, page, pageSize };
  }

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

  async create(input: CreateVersionInput) {
    const model = await this.prisma.model.findFirst({
      where: { id: input.modelId, deletedAt: null },
    });
    if (!model) throw notFound("Modelo no encontrado");
    return this.prisma.version.create({ data: input });
  }

  async update(id: string, input: UpdateVersionInput) {
    try {
      return await this.prisma.version.update({
        where: { id, deletedAt: null },
        data: input,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Versión no encontrada");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      await this.prisma.version.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Versión no encontrada");
      }
      throw e;
    }
  }
}
