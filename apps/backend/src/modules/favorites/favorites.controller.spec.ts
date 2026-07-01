import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

async function seedVersion() {
  const v = await prisma.brand.create({ data: { name: "T" } }).then((br) =>
    prisma.model.create({ data: { brandId: br.id, name: "Yaris", segment: "HATCHBACK" } })).then((m) =>
    prisma.version.create({ data: { modelId: m.id, name: "XLS", year: 2026, priceClp: 100, transmission: "MANUAL", fuel: "BENCINA",
      engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
      lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
      hasAbs: true, hasEsp: true, hasCruiseControl: true } }));
  return v;
}

async function registerUser(suffix: string) {
  const r = await request(createApp())
    .post("/api/v1/auth/register")
    .send({ email: suffix + "@" + "test.cl", password: "secreto123", name: suffix });
  return r.headers["set-cookie"]?.[0] as string;
}

describe("Favorites endpoints", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("GET /me/favorites sin auth retorna 401", async () => {
    const res = await request(createApp()).get("/api/v1/me/favorites");
    expect(res.status).toBe(401);
  });

  it("POST es idempotente: 2º call devuelve 200 con created=false", async () => {
    const cookie = await registerUser("favv1");
    const v = await seedVersion();
    const r1 = await request(createApp())
      .post("/api/v1/me/favorites")
      .set("Cookie", cookie)
      .send({ modelId: v.modelId, versionId: v.id });
    expect(r1.status).toBe(200);
    expect(r1.body.data.created).toBe(true);
    expect(r1.body.data.versionId).toBe(v.id);

    const r2 = await request(createApp())
      .post("/api/v1/me/favorites")
      .set("Cookie", cookie)
      .send({ modelId: v.modelId, versionId: v.id });
    expect(r2.status).toBe(200);
    expect(r2.body.data.created).toBe(false);
  });

  it("DELETE quita por versionId y GET /models ya no lo incluye", async () => {
    const cookie = await registerUser("favv2");
    const v = await seedVersion();
    await request(createApp()).post("/api/v1/me/favorites").set("Cookie", cookie)
      .send({ modelId: v.modelId, versionId: v.id });
    const del = await request(createApp()).delete(`/api/v1/me/favorites/${v.id}`).set("Cookie", cookie);
    expect(del.status).toBe(200);
    expect(del.body.data.removed).toBe(true);

    const list = await request(createApp()).get("/api/v1/me/favorites/models").set("Cookie", cookie);
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual([]);
  });

  it("GET /models retorna shape esperado con brand, versions y versionId preferida", async () => {
    const cookie = await registerUser("favv3");
    const v = await seedVersion();
    await request(createApp()).post("/api/v1/me/favorites").set("Cookie", cookie)
      .send({ modelId: v.modelId, versionId: v.id });

    const res = await request(createApp()).get("/api/v1/me/favorites/models").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      name: "Yaris",
      versionId: v.id,
      brand: { name: "T" },
      versions: [expect.objectContaining({ id: v.id })],
    });
  });

  it("POST con versionId inexistente retorna 404", async () => {
    const cookie = await registerUser("favv4");
    const v = await seedVersion();
    const res = await request(createApp())
      .post("/api/v1/me/favorites")
      .set("Cookie", cookie)
      .send({ modelId: v.modelId, versionId: "no-existe" });
    expect(res.status).toBe(404);
  });

  it("POST con versionId de otro modelo retorna 400", async () => {
    const cookie = await registerUser("favv5");
    const v1 = await seedVersion();
    const m2 = await prisma.brand.create({ data: { name: "X" } }).then((br) =>
      prisma.model.create({ data: { brandId: br.id, name: "Otro", segment: "SUV" } }));
    const v2 = await prisma.version.create({
      data: { modelId: m2.id, name: "v2", year: 2026, priceClp: 200, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true },
    });
    const res = await request(createApp())
      .post("/api/v1/me/favorites")
      .set("Cookie", cookie)
      .send({ modelId: v1.modelId, versionId: v2.id });
    expect(res.status).toBe(400);
  });

  it("PATCH cambia la versionId preferida", async () => {
    const cookie = await registerUser("favv6");
    const m = await prisma.brand.create({ data: { name: "T" } }).then((br) =>
      prisma.model.create({ data: { brandId: br.id, name: "Yaris", segment: "HATCHBACK" } }));
    const v1 = await prisma.version.create({
      data: { modelId: m.id, name: "XLS", year: 2026, priceClp: 100, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true },
    });
    const v2 = await prisma.version.create({
      data: { modelId: m.id, name: "Sport", year: 2025, priceClp: 200, transmission: "AUTOMATIC", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true },
    });

    await request(createApp()).post("/api/v1/me/favorites").set("Cookie", cookie)
      .send({ modelId: m.id, versionId: v1.id });

    const patch = await request(createApp())
      .patch(`/api/v1/me/favorites/${v1.id}`)
      .set("Cookie", cookie)
      .send({ modelId: m.id, newVersionId: v2.id });
    expect(patch.status).toBe(200);
    expect(patch.body.data.versionId).toBe(v2.id);

    const list = await request(createApp()).get("/api/v1/me/favorites").set("Cookie", cookie);
    expect(list.body.data.versionIds).toEqual([v2.id]);
  });
});