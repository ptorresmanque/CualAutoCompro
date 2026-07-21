import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { PopularityService } from "./popularity.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";

describe("PopularityService", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    PopularityService.resetCache();
  });

  it("recordAdd crea evento, incrementa counter, e invalida cache", async () => {
    const svc = new PopularityService(prisma);
    const { version, modelId } = await seedVersion("A");

    const beforeTop = await svc.getTopModelIds();
    expect(beforeTop).not.toContain(modelId);

    await svc.recordAdd({ versionId: version.id, cookieId: "cookie-1" });

    const events = await prisma.popularityEvent.findMany();
    expect(events).toHaveLength(1);
    expect(events[0]?.modelId).toBe(modelId);

    const counter = await prisma.popularityCounter.findUnique({ where: { modelId } });
    expect(counter?.count).toBe(1);

    const afterTop = await svc.getTopModelIds();
    expect(afterTop).toContain(modelId);
  });

  it("recordAdd dedupe: mismo cookie+model+version dentro de ventana no duplica", async () => {
    const svc = new PopularityService(prisma);
    const { version, modelId } = await seedVersion("A");

    await svc.recordAdd({ versionId: version.id, cookieId: "cookie-1" });
    await svc.recordAdd({ versionId: version.id, cookieId: "cookie-1" });
    await svc.recordAdd({ versionId: version.id, cookieId: "cookie-1" });

    const events = await prisma.popularityEvent.findMany();
    expect(events).toHaveLength(1);

    const counter = await prisma.popularityCounter.findUnique({ where: { modelId } });
    expect(counter?.count).toBe(1);
  });

  it("recordAdd permite mismo cookie con DISTINTA version del mismo modelo", async () => {
    const svc = new PopularityService(prisma);
    const { modelId, version } = await seedVersion("A");
    const v2 = await prisma.version.create({
      data: { ...versionData(modelId), name: "v2" },
    });

    await svc.recordAdd({ versionId: version.id, cookieId: "cookie-1" });
    await svc.recordAdd({ versionId: v2.id, cookieId: "cookie-1" });

    const events = await prisma.popularityEvent.findMany();
    expect(events).toHaveLength(2);
    const counter = await prisma.popularityCounter.findUnique({ where: { modelId } });
    expect(counter?.count).toBe(2);
  });

  it("recordAdd permite mismo cookie con MISMA version en modelos distintos", async () => {
    const svc = new PopularityService(prisma);
    const a = await seedVersion("A");
    const b = await seedVersion("B");

    await svc.recordAdd({ versionId: a.version.id, cookieId: "cookie-1" });
    await svc.recordAdd({ versionId: b.version.id, cookieId: "cookie-1" });

    expect(await prisma.popularityEvent.count()).toBe(2);
  });

  it("getTopModelIds ordena por cantidad desc y limita a 20", async () => {
    const svc = new PopularityService(prisma);
    const versions: Array<{ version: { id: string }; modelId: string }> = [];
    for (let i = 0; i < 22; i++) {
      const v = await seedVersion(`M${i}`);
      versions.push(v);
      // Popular i+1 veces con cookies distintas
      for (let j = 0; j < i + 1; j++) {
        await svc.recordAdd({ versionId: v.version.id, cookieId: `c-${i}-${j}` });
      }
    }

    const top = await svc.getTopModelIds();
    expect(top).toHaveLength(20);
    // El mas popular (M21 con 22 clicks) debe estar primero
    const mostPopularModel = versions[21]!.modelId;
    expect(top[0]).toBe(mostPopularModel);
    // El menos popular dentro del top (M2 con 3 clicks) debe estar ultimo
    expect(top[19]).toBe(versions[2]!.modelId);
  });

  it("getTopModelIds filtra eventos fuera de la ventana de 30 dias", async () => {
    const svc = new PopularityService(prisma);
    const { version, modelId } = await seedVersion("A");

    // Insertar un evento "viejo" manualmente (fuera de ventana)
    const longAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await prisma.popularityEvent.create({
      data: { modelId, versionId: version.id, cookieId: "old", createdAt: longAgo },
    });

    const top = await svc.getTopModelIds();
    expect(top).not.toContain(modelId);
  });

  it("getTopModelIds cachea resultados (segunda llamada no recalcula)", async () => {
    const svc = new PopularityService(prisma);
    const { version, modelId } = await seedVersion("A");
    await svc.recordAdd({ versionId: version.id, cookieId: "cookie-1" });

    const first = await svc.getTopModelIds();
    expect(first).toContain(modelId);

    // Borrar el evento debajo de la cache
    await prisma.popularityEvent.deleteMany();
    const second = await svc.getTopModelIds();
    // cache deberia seguir devolviendo el resultado cacheado
    expect(second).toEqual(first);
  });

  it("recordAdd con versionId inexistente lanza NOT_FOUND", async () => {
    const svc = new PopularityService(prisma);
    await expect(svc.recordAdd({ versionId: "does-not-exist", cookieId: "c" }))
      .rejects.toThrow("Version no encontrada");
  });

  it("prune borra eventos fuera de la ventana", async () => {
    const svc = new PopularityService(prisma);
    const { version, modelId } = await seedVersion("A");
    await prisma.popularityEvent.create({
      data: { modelId, versionId: version.id, cookieId: "old", createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) },
    });
    await prisma.popularityEvent.create({
      data: { modelId, versionId: version.id, cookieId: "fresh" },
    });

    const result = await svc.prune();
    expect(result.deleted).toBe(1);

    const remaining = await prisma.popularityEvent.findMany();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.cookieId).toBe("fresh");
  });
});

const versionData = (modelId: string) => ({
  modelId,
  name: "x",
  year: 2026,
  priceClp: 1,
  transmission: "MANUAL",
  fuel: "BENCINA",
  engineDisplacementCc: 1,
  powerHp: 1,
  torqueNm: 1,
  consumptionCityKmL: 1,
  consumptionHighwayKmL: 1,
  lengthMm: 1,
  widthMm: 1,
  heightMm: 1,
  weightKg: 1,
  trunkLiters: 1,
  airbagCount: 1,
  hasAbs: true,
  hasEsp: true,
  hasCruiseControl: true,
});

async function seedVersion(modelName: string) {
  const brand = await prisma.brand.create({ data: { name: `B-${modelName}-${Math.random()}` } });
  const model = await prisma.model.create({
    data: { brandId: brand.id, name: modelName, segment: "SEDAN" },
  });
  const version = await prisma.version.create({
    data: versionData(model.id),
  });
  return { version, modelId: model.id };
}
