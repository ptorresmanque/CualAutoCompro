import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { listModelsQuerySchema } from "./models.dto.js";
import { conflict, notFound } from "../../shared/errors.js";
import { extendEnum } from "../../shared/enum-extension.js";
import { toGalleryUrls } from "../../shared/json.js";
import { SEGMENTS, type CreateModelInput, type UpdateModelInput } from "./models.dto.admin.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { slugify } from "../../shared/slug.js";

export class ModelsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(q: z.infer<typeof listModelsQuerySchema>) {
    const where: Prisma.ModelWhereInput = {
      deletedAt: null,
      brand: { deletedAt: null },
    };
    if (q.q) {
      const term = q.q.trim();
      if (term.length > 0) {
        where.OR = [
          { name: { contains: term } },
          { brand: { name: { contains: term } } },
        ];
      }
    }
    if (q.brand) where.brandId = q.brand;
    if (q.segment) where.segment = q.segment;

    const vWhere: Prisma.VersionWhereInput = {};
    if (q.transmission) vWhere.transmission = q.transmission;
    if (q.fuel) vWhere.fuel = q.fuel;
    if (q.priceMin !== undefined || q.priceMax !== undefined) {
      vWhere.priceClp = {
        ...(q.priceMin !== undefined ? { gte: q.priceMin } : {}),
        ...(q.priceMax !== undefined ? { lte: q.priceMax } : {}),
      };
    }
    if (q.powerMin !== undefined) vWhere.powerHp = { gte: q.powerMin };
    if (q.consumptionMax !== undefined) vWhere.consumptionCityKmL = { lte: q.consumptionMax };
    if (q.consumptionHighwayMax !== undefined) vWhere.consumptionHighwayKmL = { lte: q.consumptionHighwayMax };

    const hasVersionFilters = Object.keys(vWhere).length > 0;
    if (hasVersionFilters) {
      vWhere.deletedAt = null;
      where.versions = { some: vWhere };
    }

    const versionIncludeWhere: Prisma.VersionWhereInput = hasVersionFilters
      ? { ...vWhere, deletedAt: null }
      : { deletedAt: null };

    const [total, items] = await Promise.all([
      this.prisma.model.count({ where }),
      this.prisma.model.findMany({
        where,
        include: {
          brand: true,
          versions: {
            where: versionIncludeWhere,
            orderBy: { priceClp: "asc" },
            include: {
              equipmentItems: {
                include: { equipmentItem: { select: { id: true, name: true, category: true } } },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const enriched = items.map((m) => {
      const prices = m.versions.map((v) => v.priceClp);
      const consumptions = m.versions
        .map((v) => v.consumptionCityKmL)
        .filter((c): c is number => typeof c === "number");
      const minPrice = prices.length ? Math.min(...prices) : null;
      const minConsumption = consumptions.length ? Math.min(...consumptions) : null;
      const maxPrice = prices.length ? Math.max(...prices) : null;
      const firstVersion = m.versions[0];
      const defaultVersion = firstVersion
        ? {
            id: firstVersion.id,
            name: firstVersion.name,
            priceClp: firstVersion.priceClp,
            year: firstVersion.year,
          }
        : null;
      const versions = m.versions.map((v) => ({
        id: v.id,
        modelId: v.modelId,
        name: v.name,
        year: v.year,
        priceClp: v.priceClp,
        transmission: v.transmission,
        fuel: v.fuel,
        traction: v.traction,
        engineType: v.engineType,
        engineDisplacementCc: v.engineDisplacementCc,
        powerHp: v.powerHp,
        torqueNm: v.torqueNm,
        consumptionCityKmL: v.consumptionCityKmL,
        consumptionHighwayKmL: v.consumptionHighwayKmL,
        equipmentItems: v.equipmentItems.map((ei) => ({
          equipmentItem: { id: ei.equipmentItem.id, name: ei.equipmentItem.name, category: ei.equipmentItem.category },
        })),
      }));
      const galleryUrls = toGalleryUrls(m.galleryUrls);
      return {
        id: m.id, brandId: m.brandId, name: m.name, segment: m.segment,
        // imageUrl is the explicitly-set primary image. The first gallery
        // image is only a fallback for models where the admin didn't set
        // a primary image.
        imageUrl: m.imageUrl ?? galleryUrls[0] ?? null,
        galleryUrls, brand: m.brand,
        minPrice, minConsumption, maxPrice, versionCount: m.versions.length,
        defaultVersion,
        versions,
      };
    });

    enriched.sort((a, b) => {
      const dir = q.order === "desc" ? -1 : 1;
      let cmp = 0;
      if (q.sort === "minPrice") {
        cmp = ((a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
      } else if (q.sort === "minConsumption") {
        cmp = ((a.minConsumption ?? Infinity) - (b.minConsumption ?? Infinity));
      } else {
        cmp = a.name.localeCompare(b.name);
      }
      return cmp * dir;
    });

    const start = (q.page - 1) * q.pageSize;
    return {
      total: enriched.length,
      items: enriched.slice(start, start + q.pageSize),
      page: q.page,
      pageSize: q.pageSize,
    };
  }

  async listAll() {
    const rows = await this.prisma.model.findMany({
      where: { deletedAt: null, brand: { deletedAt: null } },
      orderBy: { name: "asc" },
      include: { brand: { select: { id: true, name: true } } },
    });
    return rows.map((m) => ({ ...m, galleryUrls: toGalleryUrls(m.galleryUrls) }));
  }

  async listPaged(q: string | undefined, params: PaginationParams) {
    const where: Prisma.ModelWhereInput = {
      deletedAt: null,
      brand: { deletedAt: null },
    };
    if (q) {
      const term = q.trim();
      if (term.length > 0) {
        where.OR = [
          { name: { contains: term } },
          { brand: { name: { contains: term } } },
        ];
      }
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.model.findMany({
        where,
        orderBy: { name: "asc" },
        skip: params.skip,
        take: params.take,
        include: { brand: { select: { id: true, name: true } } },
      }),
      this.prisma.model.count({ where }),
    ]);
    const data = rows.map((m) => ({ ...m, galleryUrls: toGalleryUrls(m.galleryUrls) }));
    return { rows: data, total };
  }

  async detailBySlug(brandSlug: string, modelSlug: string) {
    // Load all active models with brand; pick the one whose combined
    // brand+name slugs match. Limited to active set so the lookup is
    // bounded; for production-scale catalogs we'd cache or store slug.
    const rows = await this.prisma.model.findMany({
      where: { deletedAt: null, brand: { deletedAt: null } },
      include: { brand: { select: { id: true, name: true } } },
    });
    const target = rows.find((m) => {
      return slugify(m.brand.name) === brandSlug && slugify(m.name) === modelSlug;
    });
    if (!target) return null;
    return this.detail(target.id);
  }


  async detail(id: string) {
    const m = await this.prisma.model.findFirst({
      where: { id, deletedAt: null, brand: { deletedAt: null } },
      include: {
        brand: true,
        versions: {
          where: { deletedAt: null },
          orderBy: { priceClp: "asc" },
          include: {
            equipmentItems: {
              include: { equipmentItem: { select: { id: true, name: true, category: true } } },
            },
          },
        },
      },
    });
    if (!m) throw notFound("Modelo no encontrado");
    return m;
  }

  async create(input: CreateModelInput) {
    const brand = await this.prisma.brand.findFirst({
      where: { id: input.brandId, deletedAt: null },
    });
    if (!brand) throw notFound("Marca no encontrada");

    const knownSegment = SEGMENTS.includes(input.segment as (typeof SEGMENTS)[number]);
    if (knownSegment) {
      return this.prisma.model.create({
        data: input as Prisma.ModelUncheckedCreateInput,
      });
    }

    await extendEnum(this.prisma, "Segment", input.segment);
    const id = randomUUID();
    // SCHEMA-DRIFT NOTE: raw SQL porque extendEnum registra un valor nuevo
    // y queremos evitar la validación de Prisma para campos `Json`. MariaDB
    // usa `?` placeholders (no `$N`), backtick identifiers, y `longtext` para
    // `Json` (string plano, normalizado por `toGalleryUrls()` al leer). El
    // driver de Prisma 5 para MariaDB **no propaga los nombres de columna**
    // cuando se usa `INSERT ... RETURNING` (devuelve `f0..fN`), así que
    // hacemos INSERT y luego un SELECT con nombres propios para que
    // `toGalleryUrls()` y el caller reciban un objeto tipado. Las listas
    // de columnas de las 3 queries abajo deben mantenerse en sync con
    // `Model` en prisma/schema.prisma — no hay verificación en compile-time.
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO \`Model\` (id, \`brandId\`, name, segment, \`imageUrl\`, \`galleryUrls\`, \`createdAt\`, \`deletedAt\`)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NULL)`,
      id,
      input.brandId,
      input.name,
      input.segment,
      input.imageUrl ?? null,
      JSON.stringify(input.galleryUrls ?? []),
    );
    const rows = await this.prisma.$queryRawUnsafe<Array<{
      id: string;
      brandId: string;
      name: string;
      segment: string;
      imageUrl: string | null;
      galleryUrls: string;
      deletedAt: Date | null;
      createdAt: Date;
    }>>(
      `SELECT id, \`brandId\`, name, segment, \`imageUrl\`, \`galleryUrls\`, \`deletedAt\`, \`createdAt\`
       FROM \`Model\` WHERE id = ? AND \`deletedAt\` IS NULL`,
      id,
    );
    const row = rows[0]!;
    return {
      ...row,
      galleryUrls: toGalleryUrls(row.galleryUrls),
    };
  }

  async update(id: string, input: UpdateModelInput) {
    const newSegment = input.segment && !SEGMENTS.includes(input.segment as (typeof SEGMENTS)[number])
      ? input.segment
      : null;
    if (newSegment) {
      await extendEnum(this.prisma, "Segment", newSegment);
      const setClauses: string[] = [];
      const values: unknown[] = [];
      if (input.name !== undefined) {
        setClauses.push("name = ?");
        values.push(input.name);
      }
      setClauses.push("segment = ?");
      values.push(input.segment);
      if (input.imageUrl !== undefined) {
        setClauses.push("`imageUrl` = ?");
        values.push(input.imageUrl);
      }
      if (input.galleryUrls !== undefined) {
        setClauses.push("`galleryUrls` = ?");
        values.push(JSON.stringify(input.galleryUrls));
      }
      values.push(id);
      // SCHEMA-DRIFT NOTE: raw UPDATE porque extendEnum agrega un valor
      // nuevo al enum runtime y Prisma's query engine lo rechazaría. En
      // MariaDB no hay RETURNING para UPDATE, así que hacemos SELECT
      // después para devolver la fila actualizada.
      const updateResult = await this.prisma.$executeRawUnsafe(
        `UPDATE \`Model\` SET ${setClauses.join(", ")} WHERE id = ? AND \`deletedAt\` IS NULL`,
        ...values,
      );
      if (updateResult === 0) throw notFound("Modelo no encontrado");
      const rows = await this.prisma.$queryRawUnsafe<Array<{
        id: string;
        brandId: string;
        name: string;
        segment: string;
        imageUrl: string | null;
        galleryUrls: string;
        deletedAt: Date | null;
        createdAt: Date;
      }>>(
        `SELECT id, \`brandId\`, name, segment, \`imageUrl\`, \`galleryUrls\`, \`deletedAt\`, \`createdAt\`
         FROM \`Model\` WHERE id = ? AND \`deletedAt\` IS NULL`,
        id,
      );
      const row = rows[0]!;
      return {
        ...row,
        galleryUrls: toGalleryUrls(row.galleryUrls),
      };
    }

    const data = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Prisma.ModelUpdateInput;
    try {
      return await this.prisma.model.update({
        where: { id, deletedAt: null },
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Modelo no encontrado");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    const count = await this.prisma.version.count({
      where: { modelId: id, deletedAt: null },
    });
    if (count > 0) {
      throw conflict("No se puede eliminar: tiene versiones asociadas", {
        code: "MODEL_HAS_VERSIONS",
        versionCount: count,
      });
    }
    await this.prisma.model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async restore(id: string) {
    const model = await this.prisma.model.findUnique({ where: { id }, select: { brandId: true } });
    if (!model) throw notFound("Modelo no encontrado");
    const brand = await this.prisma.brand.findFirst({ where: { id: model.brandId, deletedAt: null } });
    if (!brand) throw conflict("No se puede restaurar: la marca está eliminada", { code: "BRAND_DELETED" });
    return this.prisma.model.update({ where: { id }, data: { deletedAt: null } });
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
