import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("Comparisons endpoints", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("POST /api/v1/me/comparisons sin cookie de auth retorna 401 UNAUTHORIZED", async () => {
    const res = await request(createApp())
      .post("/api/v1/me/comparisons")
      .send({ versionIds: ["v1"] });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("segundo POST con mismos versionIds retorna 409 con slug existente", async () => {
    const v = await prisma.brand.create({ data: { name: "Dup" } }).then((br) =>
      prisma.model.create({ data: { brandId: br.id, name: "M", segment: "SEDAN" } })).then((m) =>
      prisma.version.create({ data: { modelId: m.id, name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true } }));
    const registered = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "dup" + "@" + "test.cl", password: "secreto123", name: "Dup" });
    expect(registered.status).toBe(200);
    const cookie = registered.headers["set-cookie"]?.[0] as string;

    const first = await request(createApp())
      .post("/api/v1/me/comparisons")
      .set("Cookie", cookie)
      .send({ versionIds: [v.id] });
    expect(first.status).toBe(200);
    const slug = first.body.data.slug as string;

    const second = await request(createApp())
      .post("/api/v1/me/comparisons")
      .set("Cookie", cookie)
      .send({ versionIds: [v.id] });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("CONFLICT");
    expect(second.body.error.slug).toBe(slug);
  });

  it("GET /api/v1/comparisons/:slug es público y retorna la comparación sin auth", async () => {
    const v = await prisma.brand.create({ data: { name: "Q" } }).then((br) =>
      prisma.model.create({ data: { brandId: br.id, name: "M", segment: "SEDAN" } })).then((m) =>
      prisma.version.create({ data: { modelId: m.id, name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true } }));
    const registered = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "reader" + "@" + "test.cl", password: "secreto123", name: "Reader" });
    expect(registered.status).toBe(200);
    const readerId = registered.body.data.id as string;
    const cookie = registered.headers["set-cookie"]?.[0];
    expect(cookie).toMatch(/^auth=/);
    const created = await request(createApp())
      .post("/api/v1/me/comparisons")
      .set("Cookie", cookie as string)
      .send({ versionIds: [v.id] });
    expect(created.status).toBe(200);
    const slug = created.body.data.slug as string;
    const pub = await request(createApp()).get(`/api/v1/comparisons/${slug}`);
    expect(pub.status).toBe(200);
    expect(pub.body.data.slug).toBe(slug);
    expect(pub.body.data.userId).toBe(readerId);
  });
});