import { describe, it, expect, beforeEach } from "vitest";
import { FavoritesService } from "./favorites.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

async function seedUserAndModelAndVersion() {
  const u = await prisma.user.create({
    data: { email: "u" + "@" + "cualautocompro.cl", name: "U", passwordHash: "x" },
  });
  const b = await prisma.brand.create({ data: { name: "B" } });
  const m = await prisma.model.create({ data: { brandId: b.id, name: "M", segment: "SEDAN" } });
  const v1 = await prisma.version.create({
    data: { modelId: m.id, name: "v1", year: 2026, priceClp: 100, transmission: "MANUAL", fuel: "BENCINA",
      engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
      lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
      hasAbs: true, hasEsp: true, hasCruiseControl: true },
  });
  const v2 = await prisma.version.create({
    data: { modelId: m.id, name: "v2", year: 2026, priceClp: 200, transmission: "AUTOMATIC", fuel: "BENCINA",
      engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
      lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
      hasAbs: true, hasEsp: true, hasCruiseControl: true },
  });
  return { u, m, v1, v2 };
}

describe("FavoritesService", () => {
  beforeEach(async () => { setupTestPrisma(); await resetTestDb(prisma); });

  it("add crea favorito por versionId; segundo add es idempotente", async () => {
    const svc = new FavoritesService(prisma);
    const { u, m, v1 } = await seedUserAndModelAndVersion();
    const r1 = await svc.add(u.id, { modelId: m.id, versionId: v1.id });
    expect(r1.created).toBe(true);
    expect(r1.versionId).toBe(v1.id);
    const r2 = await svc.add(u.id, { modelId: m.id, versionId: v1.id });
    expect(r2.created).toBe(false);
    const ids = await svc.listIds(u.id);
    expect(ids).toEqual([v1.id]);
  });

  it("remove quita favorito por versionId; segundo remove no falla", async () => {
    const svc = new FavoritesService(prisma);
    const { u, m, v1 } = await seedUserAndModelAndVersion();
    await svc.add(u.id, { modelId: m.id, versionId: v1.id });
    await svc.remove(u.id, v1.id);
    const ids = await svc.listIds(u.id);
    expect(ids).toEqual([]);
    await expect(svc.remove(u.id, v1.id)).resolves.toBeUndefined();
  });

  it("listModels retorna cards con versionId preferida", async () => {
    const svc = new FavoritesService(prisma);
    const { u, m, v1, v2 } = await seedUserAndModelAndVersion();
    await svc.add(u.id, { modelId: m.id, versionId: v2.id });
    const cards = await svc.listModels(u.id);
    expect(cards).toHaveLength(1);
    expect(cards[0]?.name).toBe("M");
    expect(cards[0]?.versionId).toBe(v2.id);
    expect(cards[0]?.versions).toHaveLength(2);
  });

  it("add con versionId inexistente lanza NOT_FOUND", async () => {
    const svc = new FavoritesService(prisma);
    const u = await prisma.user.create({
      data: { email: "u" + "@" + "cualautocompro.cl", name: "U", passwordHash: "x" },
    });
    const b = await prisma.brand.create({ data: { name: "B" } });
    const m = await prisma.model.create({ data: { brandId: b.id, name: "M", segment: "SEDAN" } });
    await expect(svc.add(u.id, { modelId: m.id, versionId: "no-existe" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("add rechaza versionId que no pertenece al modelId con BAD_REQUEST", async () => {
    const svc = new FavoritesService(prisma);
    const { u, m, v1 } = await seedUserAndModelAndVersion();
    const b2 = await prisma.brand.create({ data: { name: "B2" } });
    const m2 = await prisma.model.create({ data: { brandId: b2.id, name: "M2", segment: "SUV" } });
    const v3 = await prisma.version.create({
      data: { modelId: m2.id, name: "v3", year: 2026, priceClp: 300, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true },
    });
    await expect(svc.add(u.id, { modelId: m.id, versionId: v3.id }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("listIds está aislado por usuario", async () => {
    const svc = new FavoritesService(prisma);
    const { u, m, v1 } = await seedUserAndModelAndVersion();
    const a = await prisma.user.create({
      data: { email: "a" + "@" + "cualautocompro.cl", name: "A", passwordHash: "x" },
    });
    await svc.add(u.id, { modelId: m.id, versionId: v1.id });
    expect(await svc.listIds(u.id)).toEqual([v1.id]);
    expect(await svc.listIds(a.id)).toEqual([]);
  });

  it("updateVersion cambia la version preferida del favorito", async () => {
    const svc = new FavoritesService(prisma);
    const { u, m, v1, v2 } = await seedUserAndModelAndVersion();
    await svc.add(u.id, { modelId: m.id, versionId: v1.id });
    await svc.updateVersion(u.id, {
      currentVersionId: v1.id,
      modelId: m.id,
      newVersionId: v2.id,
    });
    const ids = await svc.listIds(u.id);
    expect(ids).toEqual([v2.id]);
    const cards = await svc.listModels(u.id);
    expect(cards[0]?.versionId).toBe(v2.id);
  });

  it("updateVersion es noop si currentVersionId === newVersionId", async () => {
    const svc = new FavoritesService(prisma);
    const { u, m, v1 } = await seedUserAndModelAndVersion();
    await svc.add(u.id, { modelId: m.id, versionId: v1.id });
    await svc.updateVersion(u.id, {
      currentVersionId: v1.id,
      modelId: m.id,
      newVersionId: v1.id,
    });
    const ids = await svc.listIds(u.id);
    expect(ids).toEqual([v1.id]);
  });

  it("updateVersion rechaza newVersionId de otro modelo con BAD_REQUEST", async () => {
    const svc = new FavoritesService(prisma);
    const { u, m, v1 } = await seedUserAndModelAndVersion();
    const b2 = await prisma.brand.create({ data: { name: "B2" } });
    const m2 = await prisma.model.create({ data: { brandId: b2.id, name: "M2", segment: "SUV" } });
    const v3 = await prisma.version.create({
      data: { modelId: m2.id, name: "v3", year: 2026, priceClp: 300, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true },
    });
    await svc.add(u.id, { modelId: m.id, versionId: v1.id });
    await expect(svc.updateVersion(u.id, {
      currentVersionId: v1.id,
      modelId: m.id,
      newVersionId: v3.id,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});