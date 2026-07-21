import crypto from "node:crypto";
import { customAlphabet } from "nanoid";
import { Prisma, type PrismaClient } from "@prisma/client";
import { badRequest, conflict, notFound } from "../../shared/errors.js";

const slugger = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);
const SLUG_RETRY_LIMIT = 5;

export class ComparisonsService {
  constructor(private readonly prisma: PrismaClient) {}

  async create({ userId, versionIds, name }: { userId: string; versionIds: string[]; name?: string }) {
    if (versionIds.length < 1 || versionIds.length > 3) throw badRequest("Compara entre 1 y 3 versiones");

    const sorted = [...versionIds].sort();
    const versionsHash = crypto.createHash("sha1").update(sorted.join(",")).digest("hex");

    const existing = await this.prisma.comparison.findUnique({
      where: { userId_versionsHash: { userId, versionsHash } },
      select: { slug: true },
    });
    if (existing) {
      throw conflict("Ya existe una comparación guardada con esos modelos", {
        code: "COMPARISON_DUPLICATE",
        slug: existing.slug ?? "",
      });
    }

    const data = {
      userId,
      versionsHash,
      ...(name !== undefined ? { name } : {}),
      items: { create: versionIds.map((versionId, i) => ({ versionId, position: i + 1 })) },
    };
    let lastError: unknown;
    for (let attempt = 0; attempt < SLUG_RETRY_LIMIT; attempt++) {
      try {
        const cmp = await this.prisma.comparison.create({
          data: { ...data, slug: slugger() },
        });
        // TODO: schema's `slug String?` is nullable; business invariant says it's always set here.
        // Tighten later by asserting non-null at the type level (e.g. branded `Slug` type).
        return { id: cmp.id, slug: cmp.slug ?? "" };
      } catch (e) {
        lastError = e;
        if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") throw e;
      }
    }
    throw lastError;
  }

  async getBySlug(slug: string) {
    const cmp = await this.prisma.comparison.findUnique({
      where: { slug },
      include: { items: { where: { version: { deletedAt: null } }, include: { version: { include: { model: { include: { brand: true } } } } }, orderBy: { position: "asc" } } },
    });
    if (!cmp) throw notFound("Comparación no encontrada");
    return cmp;
  }

  async listByUser(userId: string) {
    return this.prisma.comparison.findMany({
      where: { userId },
      include: { items: { where: { version: { deletedAt: null } }, include: { version: { include: { model: { include: { brand: true } } } } }, orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string, userId: string) {
    const cmp = await this.prisma.comparison.findUnique({ where: { id } });
    if (!cmp || cmp.userId !== userId) throw notFound("Comparación no encontrada");
    await this.prisma.comparison.delete({ where: { id } });
  }

  async rename(id: string, userId: string, name: string) {
    const comparison = await this.prisma.comparison.findUnique({ where: { id }, select: { userId: true } });
    if (!comparison || comparison.userId !== userId) throw notFound("Comparación no encontrada");
    return this.prisma.comparison.update({
      where: { id },
      data: { name: name.trim() || null },
      select: { id: true, name: true },
    });
  }
}
