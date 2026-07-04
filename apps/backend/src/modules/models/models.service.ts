import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { listModelsQuerySchema } from "./models.dto.js";
import { conflict, notFound } from "../../shared/errors.js";
import { extendEnum } from "../../shared/enum-extension.js";
import { toGalleryUrls } from "../../shared/json.js";
import { SEGMENTS, type CreateModelInput, type UpdateModelInput } from "./models.dto.admin.js";

export class ModelsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(q: z.infer<typeof listModelsQuerySchema>) {
    const where: Prisma.ModelWhereInput = { deletedAt: null };
    if (q.q) {
      const term = q.q.trim();
      if (term.length > 0) {
        where.OR = [
          { name: { contains: term, mode: "insensitive" } },
          { brand: { name: { contains: term, mode: "insensitive" } } },
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

    if (Object.keys(vWhere).length > 0) {
      vWhere.deletedAt = null;
      where.versions = { some: vWhere };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.model.count({ where }),
      this.prisma.model.findMany({
        where,
        include: {
          brand: true,
          versions: { where: { deletedAt: null }, orderBy: { priceClp: "asc" } },
        },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
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
        engineDisplacementCc: v.engineDisplacementCc,
        powerHp: v.powerHp,
        torqueNm: v.torqueNm,
        consumptionCityKmL: v.consumptionCityKmL,
        consumptionHighwayKmL: v.consumptionHighwayKmL,
      }));
      return {
        id: m.id, brandId: m.brandId, name: m.name, segment: m.segment,
        // imageUrl is the explicitly-set primary image. The first gallery
        // image is only a fallback for models where the admin didn't set
        // a primary image.
        imageUrl: m.imageUrl ?? m.galleryUrls[0] ?? null,
        galleryUrls: m.galleryUrls, brand: m.brand,
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

    return { total, items: enriched, page: q.page, pageSize: q.pageSize };
  }

  async listAll() {
    return this.prisma.model.findMany({
      where: { deletedAt: null, brand: { deletedAt: null } },
      orderBy: { name: "asc" },
      include: { brand: { select: { id: true, name: true } } },
    });
  }

  async detail(id: string) {
    const m = await this.prisma.model.findFirst({
      where: { id, deletedAt: null, brand: { deletedAt: null } },
      include: {
        brand: true,
        versions: { where: { deletedAt: null }, orderBy: { priceClp: "asc" } },
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
    // SCHEMA-DRIFT NOTE: raw SQL is required because Prisma 5's query engine
    // validates enums against the codegen-time schema and rejects new values.
    // MariaDB uses `?` placeholders (not `$N`), backtick identifiers, and
    // `longtext` for `Json` (plain string, normalized by `toGalleryUrls()`
    // on read). The column list below mirrors `Model` in prisma/schema.prisma
    // — if a column is added, removed, or renamed, this query MUST be updated
    // in lockstep. There is no compile-time check for this drift.
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
      `INSERT INTO \`Model\` (id, \`brandId\`, name, segment, \`imageUrl\`, \`galleryUrls\`, \`createdAt\`, \`deletedAt\`)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NULL)
       RETURNING id, \`brandId\`, name, segment, \`imageUrl\`, \`galleryUrls\`, \`deletedAt\`, \`createdAt\``,
      id,
      input.brandId,
      input.name,
      input.segment,
      input.imageUrl ?? null,
      JSON.stringify(input.galleryUrls ?? []),
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
      // SCHEMA-DRIFT NOTE: see the comment in create() above.
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
        `UPDATE \`Model\` SET ${setClauses.join(", ")} WHERE id = ? AND \`deletedAt\` IS NULL
         RETURNING id, \`brandId\`, name, segment, \`imageUrl\`, \`galleryUrls\`, \`deletedAt\`, \`createdAt\``,
        ...values,
      );
      if (rows.length === 0) throw notFound("Modelo no encontrado");
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
}