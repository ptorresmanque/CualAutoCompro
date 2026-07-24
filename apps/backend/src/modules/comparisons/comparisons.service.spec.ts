import { describe, it, expect, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { ComparisonsService } from "./comparisons.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("ComparisonsService", () => {
  beforeEach(async () => { setupTestPrisma(); await resetTestDb(prisma); });

  it("crea comparación con slug aleatorio de 8 chars", async () => {
    const svc = new ComparisonsService(prisma);
    const u = await prisma.user.create({ data: { email: "u" + "@" + "cualautocompro.cl", name: "U", passwordHash: "x" } });
    const v = await prisma.version.create({
      data: { modelId: "m", name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1 },
    }).catch(async () => {
      // fallback: crear model + brand si hace falta
      const b = await prisma.brand.create({ data: { name: "X" } });
      const m = await prisma.model.create({ data: { brandId: b.id, name: "M", segment: "SEDAN" } });
      return prisma.version.create({
        data: { modelId: m.id, name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
          engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
          lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1 },
      });
    });
    const out = await svc.create({ userId: u.id, versionIds: [v.id] });
    expect(out.slug).toHaveLength(8);
  });

  it("listByUser devuelve solo del usuario actual", async () => {
    const svc = new ComparisonsService(prisma);
    const a = await prisma.user.create({ data: { email: "a" + "@" + "cualautocompro.cl", name: "A", passwordHash: "x" } });
    const b = await prisma.user.create({ data: { email: "b" + "@" + "cualautocompro.cl", name: "B", passwordHash: "x" } });
    const v = await prisma.brand.create({ data: { name: "Z" } }).then((br) =>
      prisma.model.create({ data: { brandId: br.id, name: "M", segment: "SEDAN" } })).then((m) =>
      prisma.version.create({ data: { modelId: m.id, name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1 } }));
    await svc.create({ userId: a.id, versionIds: [v.id] });
    const aList = await svc.listByUser(a.id);
    expect(aList.length).toBe(1);
    const bList = await svc.listByUser(b.id);
    expect(bList.length).toBe(0);
  });

  it("create reintenta slug único en colisión P2002 hasta tener éxito", async () => {
    const svc = new ComparisonsService(prisma);
    const u = await prisma.user.create({ data: { email: "u2" + "@" + "cualautocompro.cl", name: "U2", passwordHash: "x" } });
    const v = await prisma.brand.create({ data: { name: "B" } }).then((br) =>
      prisma.model.create({ data: { brandId: br.id, name: "M", segment: "SEDAN" } })).then((m) =>
      prisma.version.create({ data: { modelId: m.id, name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1 } }));
    const originalCreate = prisma.comparison.create;
    let calls = 0;
    (prisma.comparison as unknown as { create: (...args: unknown[]) => Promise<unknown> }).create = async (...args: unknown[]) => {
      calls++;
      if (calls === 1) {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "test" });
      }
      return (originalCreate as unknown as (a: unknown) => Promise<unknown>)(args[0]);
    };
    try {
      const out = await svc.create({ userId: u.id, versionIds: [v.id] });
      expect(calls).toBeGreaterThanOrEqual(2);
      expect(out.slug).toHaveLength(8);
    } finally {
      (prisma.comparison as unknown as { create: typeof originalCreate }).create = originalCreate;
    }
  });

  it("create rechaza 0 IDs con BAD_REQUEST", async () => {
    const svc = new ComparisonsService(prisma);
    const u = await prisma.user.create({ data: { email: "u0" + "@" + "cualautocompro.cl", name: "U0", passwordHash: "x" } });
    await expect(svc.create({ userId: u.id, versionIds: [] }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("create rechaza 4 IDs con BAD_REQUEST", async () => {
    const svc = new ComparisonsService(prisma);
    const u = await prisma.user.create({ data: { email: "u4" + "@" + "cualautocompro.cl", name: "U4", passwordHash: "x" } });
    await expect(svc.create({ userId: u.id, versionIds: ["a", "b", "c", "d"] }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("getBySlug lanza NOT_FOUND para slug inexistente", async () => {
    const svc = new ComparisonsService(prisma);
    await expect(svc.getBySlug("no-existe-slug")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("delete lanza NOT_FOUND cuando la comparación pertenece a otro usuario", async () => {
    const svc = new ComparisonsService(prisma);
    const owner = await prisma.user.create({ data: { email: "own" + "@" + "cualautocompro.cl", name: "Own", passwordHash: "x" } });
    const other = await prisma.user.create({ data: { email: "oth" + "@" + "cualautocompro.cl", name: "Oth", passwordHash: "x" } });
    const v = await prisma.brand.create({ data: { name: "D" } }).then((br) =>
      prisma.model.create({ data: { brandId: br.id, name: "M", segment: "SEDAN" } })).then((m) =>
      prisma.version.create({ data: { modelId: m.id, name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1 } }));
    const created = await svc.create({ userId: owner.id, versionIds: [v.id] });
    await expect(svc.delete(created.id, other.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const stillThere = await prisma.comparison.findUnique({ where: { id: created.id } });
    expect(stillThere).not.toBeNull();
  });
});
