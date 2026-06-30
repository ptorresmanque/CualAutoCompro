import { customAlphabet } from "nanoid";
import type { PrismaClient } from "@prisma/client";
import { badRequest, notFound } from "../../shared/errors.js";

const slugger = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

export class ComparisonsService {
  constructor(private readonly prisma: PrismaClient) {}

  async create({ userId, versionIds, name }: { userId: string; versionIds: string[]; name?: string }) {
    if (versionIds.length < 1 || versionIds.length > 3) throw badRequest("Compara entre 1 y 3 versiones");
    const slug = slugger();
    const cmp = await this.prisma.comparison.create({
      data: {
        userId, slug, ...(name !== undefined ? { name } : {}),
        items: { create: versionIds.map((versionId, i) => ({ versionId, position: i + 1 })) },
      },
    });
    return { id: cmp.id, slug: cmp.slug! };
  }

  async getBySlug(slug: string) {
    const cmp = await this.prisma.comparison.findUnique({
      where: { slug },
      include: { items: { include: { version: { include: { model: { include: { brand: true } } } } }, orderBy: { position: "asc" } } },
    });
    if (!cmp) throw notFound("Comparación no encontrada");
    return cmp;
  }

  async listByUser(userId: string) {
    return this.prisma.comparison.findMany({
      where: { userId },
      include: { items: { include: { version: { include: { model: { include: { brand: true } } } } }, orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string, userId: string) {
    const cmp = await this.prisma.comparison.findUnique({ where: { id } });
    if (!cmp || cmp.userId !== userId) throw notFound("Comparación no encontrada");
    await this.prisma.comparison.delete({ where: { id } });
  }
}
