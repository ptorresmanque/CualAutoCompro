import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { loginAsAdmin } from "../../../__tests__/helpers/auth.js";
import { prisma } from "../../infra/prisma.js";

const baseVersion = {
  year: 2026, priceClp: 10_000_000, transmission: "MANUAL", fuel: "BENCINA",
  powerHp: 100, torqueNm: 130, lengthMm: 4000, widthMm: 1700, heightMm: 1500,
  weightKg: 1100, trunkLiters: 300,
};

const seed = async () => {
  const brand = await prisma.brand.create({ data: { name: "Toyota" } });
  const model = await prisma.model.create({ data: { brandId: brand.id, name: "Yaris", segment: "HATCHBACK" } });
  const version = await prisma.version.create({ data: { ...baseVersion, modelId: model.id, name: "XLS" } });
  const a = await prisma.equipmentItem.create({ data: { name: "Climatizador", category: "Confort" } });
  const b = await prisma.equipmentItem.create({ data: { name: "Airbags", category: "Seguridad" } });
  const c = await prisma.equipmentItem.create({ data: { name: "Cámara", category: "Seguridad" } });
  await prisma.versionEquipment.createMany({
    data: [
      { versionId: version.id, equipmentItemId: a.id },
      { versionId: version.id, equipmentItemId: b.id },
    ],
  });
  return { version, a, b, c };
};

const attachedIds = async (versionId: string): Promise<string[]> => {
  const rows = await prisma.versionEquipment.findMany({ where: { versionId }, select: { equipmentItemId: true } });
  return rows.map((r) => r.equipmentItemId).sort();
};

describe("PUT /api/v1/admin/equipment/version/:versionId", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("sin auth → 401", async () => {
    const res = await request(createApp()).put("/api/v1/admin/equipment/version/x").send({ itemIds: [] });
    expect(res.status).toBe(401);
  });

  it("sincroniza en una llamada: agrega los nuevos y quita los que salieron", async () => {
    const { version, a, b, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [b.id, c.id] });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toEqual({ attached: 1, detached: 1 });
    expect(await attachedIds(version.id)).toEqual([b.id, c.id].sort());
    // `a` quedó desasociado pero el ítem sigue existiendo.
    expect(await prisma.equipmentItem.findUnique({ where: { id: a.id } })).not.toBeNull();
  });

  it("es idempotente: repetir la misma lista no da 409 ni cambia nada", async () => {
    const { version, a, b } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [a.id, b.id] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ attached: 0, detached: 0 });
    expect(await attachedIds(version.id)).toEqual([a.id, b.id].sort());
  });

  it("lista vacía desasocia todo", async () => {
    const { version } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [] });

    expect(res.body.data).toEqual({ attached: 0, detached: 2 });
    expect(await attachedIds(version.id)).toEqual([]);
  });

  it("versión inexistente → 404 y no toca nada", async () => {
    const { version, a, b } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put("/api/v1/admin/equipment/version/no-existe")
      .set("Cookie", cookie)
      .send({ itemIds: [a.id] });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(await attachedIds(version.id)).toEqual([a.id, b.id].sort());
  });

  it("ítem inexistente → 404 y no aplica el resto del diff", async () => {
    const { version, a, b } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [a.id, "fantasma"] });

    expect(res.status).toBe(404);
    expect(await attachedIds(version.id)).toEqual([a.id, b.id].sort());
  });

  it("body sin itemIds → 400 VALIDATION", async () => {
    const { version } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });
});
