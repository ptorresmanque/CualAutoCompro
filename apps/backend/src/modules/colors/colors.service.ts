import { Prisma, type PrismaClient } from "@prisma/client";
import { conflict, notFound } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import type { CreateColorInput, UpdateColorInput } from "./colors.dto.admin.js";

export class ColorsService {
  constructor(private readonly prisma: PrismaClient) {}

  listAll() {
    return this.prisma.color.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async listPaged(q: string | undefined, params: PaginationParams) {
    const where: Prisma.ColorWhereInput = { deletedAt: null };
    if (q) {
      const term = q.trim();
      if (term.length > 0) where.name = { contains: term };
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.color.findMany({
        where,
        orderBy: { name: "asc" },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.color.count({ where }),
    ]);
    return { rows, total };
  }

  async create(input: CreateColorInput) {
    return this.prisma.color.create({ data: input as Prisma.ColorCreateInput });
  }

  async update(id: string, input: UpdateColorInput) {
    const data = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Prisma.ColorUpdateInput;
    try {
      return await this.prisma.color.update({
        where: { id, deletedAt: null },
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Color no encontrado");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      const attachedVersions = await this.prisma.versionColor.count({
        where: { colorId: id, version: { deletedAt: null } },
      });
      if (attachedVersions > 0) {
        throw conflict("No se puede eliminar: el color está asociado a versiones", {
          code: "COLOR_IN_USE",
          versionCount: attachedVersions,
        });
      }
      await this.prisma.color.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Color no encontrado");
      }
      throw e;
    }
  }

  async restore(id: string) {
    try {
      return await this.prisma.color.update({
        where: { id },
        data: { deletedAt: null },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Color no encontrado");
      }
      throw e;
    }
  }

  async attach(versionId: string, colorId: string) {
    try {
      const [version, color] = await Promise.all([
        this.prisma.version.findFirst({
          where: { id: versionId, deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } },
          select: { id: true },
        }),
        this.prisma.color.findFirst({
          where: { id: colorId, deletedAt: null },
          select: { id: true },
        }),
      ]);
      if (!version) throw notFound("Versión no encontrada");
      if (!color) throw notFound("Color no encontrado");
      return await this.prisma.versionColor.create({
        data: { versionId, colorId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw conflict("El color ya está asociado a esta versión", {
          code: "COLOR_ALREADY_ATTACHED",
        });
      }
      throw e;
    }
  }

  async detach(versionId: string, colorId: string) {
    try {
      await this.prisma.versionColor.delete({
        where: { versionId_colorId: { versionId, colorId } },
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
