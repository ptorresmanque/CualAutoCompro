import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import { extendEnum } from "../../shared/enum-extension.js";
import {
  FUELS,
  TRANSMISSIONS,
  type CreateVersionInput,
  type UpdateVersionInput,
} from "./versions.dto.admin.js";

type VersionRow = {
  id: string;
  modelId: string;
  name: string;
  year: number;
  priceClp: number;
  transmission: string;
  fuel: string;
  engineDisplacementCc: number;
  powerHp: number;
  torqueNm: number;
  consumptionCityKmL: number;
  consumptionHighwayKmL: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  weightKg: number;
  trunkLiters: number;
  airbagCount: number;
  hasAbs: boolean;
  hasEsp: boolean;
  hasCruiseControl: boolean;
  deletedAt: Date | null;
  createdAt: Date;
};

const VERSION_RETURNING = `id, "modelId", name, year, "priceClp", transmission, fuel,
  "engineDisplacementCc", "powerHp", "torqueNm", "consumptionCityKmL",
  "consumptionHighwayKmL", "lengthMm", "widthMm", "heightMm", "weightKg",
  "trunkLiters", "airbagCount", "hasAbs", "hasEsp", "hasCruiseControl",
  "deletedAt", "createdAt"`;

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

  async listAll() {
    return this.prisma.version.findMany({
      where: {
        deletedAt: null,
        model: { deletedAt: null, brand: { deletedAt: null } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        model: { select: { id: true, name: true } },
        equipmentItems: {
          include: {
            equipmentItem: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });
  }

  async detail(id: string) {
    const v = await this.prisma.version.findFirst({
      where: {
        id,
        deletedAt: null,
        model: { deletedAt: null, brand: { deletedAt: null } },
      },
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

    const knownFuel = FUELS.includes(input.fuel as (typeof FUELS)[number]);
    const knownTrans = TRANSMISSIONS.includes(
      input.transmission as (typeof TRANSMISSIONS)[number],
    );
    if (knownFuel && knownTrans) {
      return this.prisma.version.create({
        data: input as Prisma.VersionUncheckedCreateInput,
      });
    }

    if (!knownFuel) {
      await extendEnum(this.prisma, "Fuel", input.fuel);
    }
    if (!knownTrans) {
      await extendEnum(this.prisma, "Transmission", input.transmission);
    }

    const id = randomUUID();
    // SCHEMA-DRIFT NOTE: raw SQL porque extendEnum agrega un valor nuevo
    // al enum runtime y Prisma's query engine lo rechazaría. MariaDB usa
    // `?` placeholders, VARCHAR (no cast de enum), backtick identifiers.
    // IMPORTANTE: `INSERT ... RETURNING` con Prisma 5.22 + MariaDB devuelve
    // columnas como `f0..fN` (no nombres), por eso hacemos INSERT y luego
    // SELECT explícito para tener nombres de columna tipados.
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO \`Version\` (
         id, \`modelId\`, name, year, \`priceClp\`, transmission, fuel,
         \`engineDisplacementCc\`, \`powerHp\`, \`torqueNm\`, \`consumptionCityKmL\`,
         \`consumptionHighwayKmL\`, \`lengthMm\`, \`widthMm\`, \`heightMm\`, \`weightKg\`,
         \`trunkLiters\`, \`airbagCount\`, \`hasAbs\`, \`hasEsp\`, \`hasCruiseControl\`,
         \`deletedAt\`, \`createdAt\`
       )
       VALUES (
         ?, ?, ?, ?, ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         NULL, NOW()
       )`,
      id,
      input.modelId,
      input.name,
      input.year,
      input.priceClp,
      input.transmission,
      input.fuel,
      input.engineDisplacementCc,
      input.powerHp,
      input.torqueNm,
      input.consumptionCityKmL,
      input.consumptionHighwayKmL,
      input.lengthMm,
      input.widthMm,
      input.heightMm,
      input.weightKg,
      input.trunkLiters,
      input.airbagCount,
      input.hasAbs,
      input.hasEsp,
      input.hasCruiseControl,
    );
    const rows = await this.prisma.$queryRawUnsafe<VersionRow[]>(
      `SELECT ${VERSION_RETURNING} FROM \`Version\` WHERE id = ?`,
      id,
    );
    return rows[0]!;
  }

  async update(id: string, input: UpdateVersionInput) {
    const newFuel =
      input.fuel && !FUELS.includes(input.fuel as (typeof FUELS)[number])
        ? input.fuel
        : null;
    const newTrans =
      input.transmission &&
      !TRANSMISSIONS.includes(input.transmission as (typeof TRANSMISSIONS)[number])
        ? input.transmission
        : null;

    if (newFuel || newTrans) {
      if (newFuel) {
        await extendEnum(this.prisma, "Fuel", newFuel);
      }
      if (newTrans) {
        await extendEnum(this.prisma, "Transmission", newTrans);
      }

      const setClauses: string[] = [];
      const values: unknown[] = [];
      if (input.name !== undefined) {
        setClauses.push("name = ?");
        values.push(input.name);
      }
      if (input.year !== undefined) {
        setClauses.push("year = ?");
        values.push(input.year);
      }
      if (input.priceClp !== undefined) {
        setClauses.push("`priceClp` = ?");
        values.push(input.priceClp);
      }
      if (input.transmission !== undefined) {
        setClauses.push("transmission = ?");
        values.push(input.transmission);
      }
      if (input.fuel !== undefined) {
        setClauses.push("fuel = ?");
        values.push(input.fuel);
      }
      if (input.engineDisplacementCc !== undefined) {
        setClauses.push("`engineDisplacementCc` = ?");
        values.push(input.engineDisplacementCc);
      }
      if (input.powerHp !== undefined) {
        setClauses.push("`powerHp` = ?");
        values.push(input.powerHp);
      }
      if (input.torqueNm !== undefined) {
        setClauses.push("`torqueNm` = ?");
        values.push(input.torqueNm);
      }
      if (input.consumptionCityKmL !== undefined) {
        setClauses.push("`consumptionCityKmL` = ?");
        values.push(input.consumptionCityKmL);
      }
      if (input.consumptionHighwayKmL !== undefined) {
        setClauses.push("`consumptionHighwayKmL` = ?");
        values.push(input.consumptionHighwayKmL);
      }
      if (input.lengthMm !== undefined) {
        setClauses.push("`lengthMm` = ?");
        values.push(input.lengthMm);
      }
      if (input.widthMm !== undefined) {
        setClauses.push("`widthMm` = ?");
        values.push(input.widthMm);
      }
      if (input.heightMm !== undefined) {
        setClauses.push("`heightMm` = ?");
        values.push(input.heightMm);
      }
      if (input.weightKg !== undefined) {
        setClauses.push("`weightKg` = ?");
        values.push(input.weightKg);
      }
      if (input.trunkLiters !== undefined) {
        setClauses.push("`trunkLiters` = ?");
        values.push(input.trunkLiters);
      }
      if (input.airbagCount !== undefined) {
        setClauses.push("`airbagCount` = ?");
        values.push(input.airbagCount);
      }
      if (input.hasAbs !== undefined) {
        setClauses.push("`hasAbs` = ?");
        values.push(input.hasAbs);
      }
      if (input.hasEsp !== undefined) {
        setClauses.push("`hasEsp` = ?");
        values.push(input.hasEsp);
      }
      if (input.hasCruiseControl !== undefined) {
        setClauses.push("`hasCruiseControl` = ?");
        values.push(input.hasCruiseControl);
      }
      values.push(id);
      // SCHEMA-DRIFT NOTE: raw UPDATE porque extendEnum agrega un valor
      // nuevo al enum runtime. En MariaDB no hay RETURNING para UPDATE,
      // así que hacemos SELECT después para devolver la fila actualizada.
      const updateResult = await this.prisma.$executeRawUnsafe(
        `UPDATE \`Version\` SET ${setClauses.join(", ")} WHERE id = ? AND \`deletedAt\` IS NULL`,
        ...values,
      );
      if (updateResult === 0) throw notFound("Versión no encontrada");
      const rows = await this.prisma.$queryRawUnsafe<VersionRow[]>(
        `SELECT ${VERSION_RETURNING} FROM \`Version\` WHERE id = ? AND \`deletedAt\` IS NULL`,
        id,
      );
      return rows[0]!;
    }

    const data = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Prisma.VersionUpdateInput;
    try {
      return await this.prisma.version.update({
        where: { id, deletedAt: null },
        data,
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