import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";
import { PopularityService } from "./popularity.service.js";

async function seedVersion() {
  const brand = await prisma.brand.create({ data: { name: `B-${Math.random()}` } });
  const model = await prisma.model.create({
    data: { brandId: brand.id, name: "M", segment: "SEDAN" },
  });
  const version = await prisma.version.create({
    data: {
      modelId: model.id,
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
      lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1,
      trunkLiters: 1,
    },
  });
  return { version, modelId: model.id };
}

describe("Popularity endpoints", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    PopularityService.resetCache();
  });

  it("GET /api/v1/popular/models devuelve lista vacia sin eventos", async () => {
    const res = await request(createApp()).get("/api/v1/popular/models");
    expect(res.status).toBe(200);
    expect(res.body.data.ids).toEqual([]);
  });

  it("POST /api/v1/popular/events registra evento y setea cookie anonima", async () => {
    const { version, modelId } = await seedVersion();
    const res = await request(createApp())
      .post("/api/v1/popular/events")
      .send({ versionId: version.id });
    expect(res.status).toBe(204);
    const cookie = res.headers["set-cookie"]?.[0];
    expect(cookie).toBeDefined();
    expect(cookie).toContain("cmp_uid=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");

    const events = await prisma.popularityEvent.findMany();
    expect(events).toHaveLength(1);
    expect(events[0]?.modelId).toBe(modelId);
  });

  it("mismo cookie + mismo version no genera duplicado (dedupe)", async () => {
    const { version } = await seedVersion();
    const app = request(createApp());
    const first = await app.post("/api/v1/popular/events").send({ versionId: version.id });
    const cookie = (first.headers["set-cookie"]?.[0] ?? "").split(";")[0]!;

    const second = await app.post("/api/v1/popular/events")
      .set("Cookie", cookie)
      .send({ versionId: version.id });
    expect(second.status).toBe(204);

    const events = await prisma.popularityEvent.count();
    expect(events).toBe(1);
  });

  it("mismo cookie + distinta version del mismo modelo genera DOS eventos", async () => {
    const { modelId, version } = await seedVersion();
    const v2 = await prisma.version.create({
      data: {
        modelId, name: "v2", year: 2026, priceClp: 1,
        transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1,
        consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1,
        trunkLiters: 1,
      },
    });
    const app = request(createApp());
    const first = await app.post("/api/v1/popular/events").send({ versionId: version.id });
    const cookie = (first.headers["set-cookie"]?.[0] ?? "").split(";")[0]!;
    await app.post("/api/v1/popular/events")
      .set("Cookie", cookie)
      .send({ versionId: v2.id });

    expect(await prisma.popularityEvent.count()).toBe(2);
  });

  it("POST sin versionId retorna 400 VALIDATION", async () => {
    const res = await request(createApp()).post("/api/v1/popular/events").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("POST con versionId inexistente retorna 404 NOT_FOUND", async () => {
    const res = await request(createApp())
      .post("/api/v1/popular/events")
      .send({ versionId: "does-not-exist" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("distintos cookies pueden agregar la misma version (sin dedupe cruzado)", async () => {
    const { version } = await seedVersion();
    const app = request(createApp());
    const a = await app.post("/api/v1/popular/events").send({ versionId: version.id });
    const cookieA = (a.headers["set-cookie"]?.[0] ?? "").split(";")[0]!;
    await app.post("/api/v1/popular/events")
      .set("Cookie", cookieA)
      .send({ versionId: version.id });
    // Segundo navegador sin cookie
    await app.post("/api/v1/popular/events").send({ versionId: version.id });

    expect(await prisma.popularityEvent.count()).toBe(2);
  });

  it("GET /popular/models muestra los IDs populares despues de eventos", async () => {
    const a = await seedVersion();
    const b = await seedVersion();
    const svc = new PopularityService(prisma);
    // a con 3 cookies, b con 1
    for (const c of ["c1", "c2", "c3"]) {
      await svc.recordAdd({ versionId: a.version.id, cookieId: c });
    }
    await svc.recordAdd({ versionId: b.version.id, cookieId: "cb1" });

    const res = await request(createApp()).get("/api/v1/popular/models");
    expect(res.status).toBe(200);
    expect(res.body.data.ids[0]).toBe(a.modelId);
    expect(res.body.data.ids).toContain(b.modelId);
  });
});
