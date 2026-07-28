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
  const rojo = await prisma.color.create({ data: { name: "Rojo", hex: "#FF0000" } });
  const azul = await prisma.color.create({ data: { name: "Azul", hex: "#0000FF" } });
  const verde = await prisma.color.create({ data: { name: "Verde", hex: "#00FF00" } });
  await prisma.versionColor.createMany({
    data: [
      { versionId: version.id, colorId: rojo.id },
      { versionId: version.id, colorId: azul.id },
    ],
  });
  return { version, rojo, azul, verde };
};

const attachedIds = async (versionId: string): Promise<string[]> => {
  const rows = await prisma.versionColor.findMany({ where: { versionId }, select: { colorId: true } });
  return rows.map((r) => r.colorId).sort();
};

describe("PUT /api/v1/admin/colors/version/:versionId", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("sin auth → 401", async () => {
    const res = await request(createApp()).put("/api/v1/admin/colors/version/x").send({ colorIds: [] });
    expect(res.status).toBe(401);
  });

  it("sincroniza en una llamada: agrega los nuevos y quita los que salieron", async () => {
    const { version, rojo, azul, verde } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/colors/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ colorIds: [azul.id, verde.id] });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toEqual({ attached: 1, detached: 1 });
    expect(await attachedIds(version.id)).toEqual([azul.id, verde.id].sort());
    expect(await prisma.color.findUnique({ where: { id: rojo.id } })).not.toBeNull();
  });

  it("es idempotente: repetir la misma lista no da 409 ni cambia nada", async () => {
    const { version, rojo, azul } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/colors/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ colorIds: [rojo.id, azul.id] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ attached: 0, detached: 0 });
    expect(await attachedIds(version.id)).toEqual([rojo.id, azul.id].sort());
  });

  it("lista vacía desasocia todo", async () => {
    const { version } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/colors/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ colorIds: [] });

    expect(res.body.data).toEqual({ attached: 0, detached: 2 });
    expect(await attachedIds(version.id)).toEqual([]);
  });

  it("versión inexistente → 404 y no toca nada", async () => {
    const { version, rojo, azul } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put("/api/v1/admin/colors/version/no-existe")
      .set("Cookie", cookie)
      .send({ colorIds: [rojo.id] });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(await attachedIds(version.id)).toEqual([rojo.id, azul.id].sort());
  });

  it("color inexistente → 404 y no aplica el resto del diff", async () => {
    const { version, rojo, azul } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/colors/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ colorIds: [rojo.id, "fantasma"] });

    expect(res.status).toBe(404);
    expect(await attachedIds(version.id)).toEqual([rojo.id, azul.id].sort());
  });

  it("body sin colorIds → 400 VALIDATION", async () => {
    const { version } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/colors/version/${version.id}`)
      .set("Cookie", cookie)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });
});
