import { describe, it, expect, beforeEach } from "vitest";
import { FavoritesService } from "./favorites.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("FavoritesService", () => {
  beforeEach(async () => { setupTestPrisma(); await resetTestDb(prisma); });

  it("add crea favorito; segundo add es idempotente", async () => {
    const svc = new FavoritesService(prisma);
    const u = await prisma.user.create({ data: { email: "u" + "@" + "cualautocompro.cl", name: "U", passwordHash: "x" } });
    const b = await prisma.brand.create({ data: { name: "B" } });
    const m = await prisma.model.create({ data: { brandId: b.id, name: "M", segment: "SEDAN" } });

    const r1 = await svc.add(u.id, m.id);
    expect(r1.created).toBe(true);
    const r2 = await svc.add(u.id, m.id);
    expect(r2.created).toBe(false);

    const ids = await svc.listIds(u.id);
    expect(ids).toEqual([m.id]);
  });

  it("remove quita favorito; segundo remove no falla", async () => {
    const svc = new FavoritesService(prisma);
    const u = await prisma.user.create({ data: { email: "u" + "@" + "cualautocompro.cl", name: "U", passwordHash: "x" } });
    const b = await prisma.brand.create({ data: { name: "B" } });
    const m = await prisma.model.create({ data: { brandId: b.id, name: "M", segment: "SEDAN" } });
    await svc.add(u.id, m.id);
    await svc.remove(u.id, m.id);
    const ids = await svc.listIds(u.id);
    expect(ids).toEqual([]);
    await expect(svc.remove(u.id, m.id)).resolves.toBeUndefined();
  });

  it("listModels retorna shape correcto con versiones", async () => {
    const svc = new FavoritesService(prisma);
    const u = await prisma.user.create({ data: { email: "u" + "@" + "cualautocompro.cl", name: "U", passwordHash: "x" } });
    const b = await prisma.brand.create({ data: { name: "T" } });
    const m = await prisma.model.create({ data: { brandId: b.id, name: "Yaris", segment: "HATCHBACK" } });
    await prisma.version.create({
      data: { modelId: m.id, name: "XLS", year: 2026, priceClp: 14990000, transmission: "AUTOMATIC", fuel: "BENCINA",
        engineDisplacementCc: 1500, powerHp: 120, torqueNm: 145, consumptionCityKmL: 14, consumptionHighwayKmL: 18,
        lengthMm: 4200, widthMm: 1760, heightMm: 1480, weightKg: 1100, trunkLiters: 360, airbagCount: 6,
        hasAbs: true, hasEsp: true, hasCruiseControl: true },
    });
    await svc.add(u.id, m.id);

    const cards = await svc.listModels(u.id);
    expect(cards).toHaveLength(1);
    expect(cards[0]?.name).toBe("Yaris");
    expect(cards[0]?.brand.name).toBe("T");
    expect(cards[0]?.minPrice).toBe(14990000);
    expect(cards[0]?.versions).toHaveLength(1);
    expect(cards[0]?.versions[0]?.powerHp).toBe(120);
  });

  it("add con modelId inexistente lanza NOT_FOUND", async () => {
    const svc = new FavoritesService(prisma);
    const u = await prisma.user.create({ data: { email: "u" + "@" + "cualautocompro.cl", name: "U", passwordHash: "x" } });
    await expect(svc.add(u.id, "no-existe")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("listIds está aislado por usuario", async () => {
    const svc = new FavoritesService(prisma);
    const a = await prisma.user.create({ data: { email: "a" + "@" + "cualautocompro.cl", name: "A", passwordHash: "x" } });
    const b = await prisma.user.create({ data: { email: "b" + "@" + "cualautocompro.cl", name: "B", passwordHash: "x" } });
    const br = await prisma.brand.create({ data: { name: "X" } });
    const m = await prisma.model.create({ data: { brandId: br.id, name: "M", segment: "SEDAN" } });
    await svc.add(a.id, m.id);
    expect(await svc.listIds(a.id)).toEqual([m.id]);
    expect(await svc.listIds(b.id)).toEqual([]);
  });
});
