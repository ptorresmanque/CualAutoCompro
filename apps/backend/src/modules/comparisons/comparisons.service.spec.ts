import { describe, it, expect, beforeEach } from "vitest";
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
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true },
    }).catch(async () => {
      // fallback: crear model + brand si hace falta
      const b = await prisma.brand.create({ data: { name: "X" } });
      const m = await prisma.model.create({ data: { brandId: b.id, name: "M", segment: "SEDAN" } });
      return prisma.version.create({
        data: { modelId: m.id, name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
          engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
          lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
          hasAbs: true, hasEsp: true, hasCruiseControl: true },
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
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true } }));
    await svc.create({ userId: a.id, versionIds: [v.id] });
    const aList = await svc.listByUser(a.id);
    expect(aList.length).toBe(1);
    const bList = await svc.listByUser(b.id);
    expect(bList.length).toBe(0);
  });
});
