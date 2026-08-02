import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { loginAsAdmin } from "../../../__tests__/helpers/auth.js";
import { prisma } from "../../infra/prisma.js";

const seed = async () => {
  const toyota = await prisma.brand.create({ data: { name: "Toyota" } });
  const yaris = await prisma.model.create({ data: { brandId: toyota.id, name: "Yaris", segment: "HATCHBACK" } });
  const v = await prisma.version.create({
    data: {
      modelId: yaris.id, name: "XLS", year: 2026, priceClp: 14_990_000,
      transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1496,
      powerHp: 110, torqueNm: 140, consumptionCityKmL: 14, consumptionHighwayKmL: 19,
      lengthMm: 3940, widthMm: 1740, heightMm: 1480, weightKg: 1100, trunkLiters: 286,
    },
  });
  const climatizador = await prisma.equipmentItem.create({ data: { name: "Climatizador", category: "Confort" } });
  await prisma.versionEquipment.create({ data: { versionId: v.id, equipmentItemId: climatizador.id } });
  await prisma.maintenanceCost.create({ data: { versionId: v.id, mileageTag: 10000, costClp: 250000 } });
  await prisma.maintenanceCost.create({ data: { versionId: v.id, mileageTag: 20000, costClp: 320000 } });
  return { versionId: v.id, brandId: toyota.id, modelId: yaris.id };
};

describe("GET /api/v1/versions", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    await seed();
  });

  it("GET /api/v1/versions lista versiones paginadas", async () => {
    const res = await request(createApp()).get("/api/v1/versions");
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toHaveProperty("total");
    expect(res.body.data).toHaveProperty("items");
    expect(res.body.data).toHaveProperty("page");
    expect(res.body.data).toHaveProperty("pageSize");
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it("respeta pageSize=1 limitando items", async () => {
    const res = await request(createApp()).get("/api/v1/versions?pageSize=1");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.pageSize).toBe(1);
  });

  // Rutas declaradas antes de `/:id`, si no Express las toma como id de versión.
  it("GET /api/v1/versions/fuels lista los combustibles disponibles", async () => {
    const res = await request(createApp()).get("/api/v1/versions/fuels");
    expect(res.status).toBe(200);
    expect(res.body.data.map((f: { id: string }) => f.id)).toEqual(
      expect.arrayContaining(["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"]),
    );
  });

  it("GET /api/v1/versions/transmissions lista las transmisiones disponibles", async () => {
    const res = await request(createApp()).get("/api/v1/versions/transmissions");
    expect(res.status).toBe(200);
    expect(res.body.data.map((t: { id: string }) => t.id)).toEqual(
      expect.arrayContaining(["MANUAL", "AUTOMATIC", "CVT", "DCT"]),
    );
  });
});

describe("GET /api/v1/versions/:id", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("retorna 200 con payload completo (brand, model, equipmentItems, maintenanceCosts) para id existente", async () => {
    const { versionId, brandId, modelId } = await seed();
    const res = await request(createApp()).get(`/api/v1/versions/${versionId}`);
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data.id).toBe(versionId);
    expect(res.body.data.modelId).toBe(modelId);
    expect(res.body.data.model.brandId).toBe(brandId);
    expect(res.body.data.model.brand.name).toBe("Toyota");
  });

  it("equipmentItems retorna estructura anidada { equipmentItem: { name, category } }", async () => {
    const { versionId } = await seed();
    const res = await request(createApp()).get(`/api/v1/versions/${versionId}`);
    expect(res.body.data.equipmentItems).toHaveLength(1);
    expect(res.body.data.equipmentItems[0].equipmentItem.name).toBe("Climatizador");
    expect(res.body.data.equipmentItems[0].equipmentItem.category).toBe("Confort");
  });

  it("maintenanceCosts retorna fila por mileageTag (10k, 20k)", async () => {
    const { versionId } = await seed();
    const res = await request(createApp()).get(`/api/v1/versions/${versionId}`);
    expect(res.body.data.maintenanceCosts).toHaveLength(2);
    const tags = res.body.data.maintenanceCosts.map((m: { mileageTag: number }) => m.mileageTag).sort();
    expect(tags).toEqual([10000, 20000]);
  });

  it("retorna 404 NOT_FOUND para id inexistente", async () => {
    const res = await request(createApp()).get("/api/v1/versions/no-existe-este-id");
    expect(res.status).toBe(404);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/v1/admin/versions", () => {
  it("sin auth → 401", async () => {
    const res = await request(createApp()).get("/api/v1/admin/versions");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/admin/versions/options", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("sin auth → 401", async () => {
    const res = await request(createApp()).get("/api/v1/admin/versions/options");
    expect(res.status).toBe(401);
  });

  it("lista todas las versiones con label 'Modelo Nombre (Año)' y sin relaciones pesadas", async () => {
    await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    const res = await request(app).get("/api/v1/admin/versions/options").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toHaveLength(1);
    const [option] = res.body.data;
    expect(option.name).toBe("Yaris XLS (2026)");
    expect(option.modelName).toBe("Yaris");
    expect(option.year).toBe(2026);
    expect(option).not.toHaveProperty("equipmentItems");
    expect(option).not.toHaveProperty("colorItems");
  });

  it("no queda capturado por la ruta /:id/price-history", async () => {
    await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    const res = await request(app).get("/api/v1/admin/versions/options").set("Cookie", cookie);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("devuelve más de 50 versiones (el selector ya no topa en pageSize)", async () => {
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "Yaris", segment: "HATCHBACK" } });
    await prisma.version.createMany({
      data: Array.from({ length: 55 }, (_, i) => ({
        modelId: model.id, name: `V${i}`, year: 2026, priceClp: 10_000_000,
        transmission: "MANUAL", fuel: "BENCINA", powerHp: 100, torqueNm: 130,
        lengthMm: 4000, widthMm: 1700, heightMm: 1500, weightKg: 1100, trunkLiters: 300,
      })),
    });
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    const res = await request(app).get("/api/v1/admin/versions/options").set("Cookie", cookie);
    expect(res.body.data).toHaveLength(55);
  });

  it("excluye versiones eliminadas y las de modelos eliminados", async () => {
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "Yaris", segment: "HATCHBACK" } });
    const deadModel = await prisma.model.create({ data: { brandId: brand.id, name: "Muerto", segment: "SUV", deletedAt: new Date() } });
    const base = {
      year: 2026, priceClp: 10_000_000, transmission: "MANUAL", fuel: "BENCINA",
      powerHp: 100, torqueNm: 130, lengthMm: 4000, widthMm: 1700, heightMm: 1500,
      weightKg: 1100, trunkLiters: 300,
    };
    await prisma.version.create({ data: { ...base, modelId: model.id, name: "Viva" } });
    await prisma.version.create({ data: { ...base, modelId: model.id, name: "Borrada", deletedAt: new Date() } });
    await prisma.version.create({ data: { ...base, modelId: deadModel.id, name: "Huerfana" } });

    const app = createApp();
    const cookie = await loginAsAdmin(app);
    const res = await request(app).get("/api/v1/admin/versions/options").set("Cookie", cookie);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Yaris Viva (2026)");
  });
});

/**
 * Mover una versión de modelo: el admin edita o duplica y cambia el selector
 * "Modelo". El front manda `modelId` en el payload; acá se verifica que el
 * cambio efectivamente aterrice en la fila.
 */
describe("cambiar el modelo de una versión", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  const otherModel = async (brandId: string) =>
    prisma.model.create({ data: { brandId, name: "Corolla", segment: "SEDAN" } });

  it("PATCH /admin/versions/:id mueve la versión al modelo nuevo", async () => {
    const { versionId, brandId } = await seed();
    const corolla = await otherModel(brandId);
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .patch(`/api/v1/admin/versions/${versionId}`)
      .set("Cookie", cookie)
      .send({ name: "XLS", modelId: corolla.id });

    expect(res.status).toBe(200);
    const saved = await prisma.version.findUniqueOrThrow({ where: { id: versionId } });
    expect(saved.modelId).toBe(corolla.id);
  });

  it("PATCH con un modelId inexistente → 404 y no toca la fila", async () => {
    const { versionId, modelId } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .patch(`/api/v1/admin/versions/${versionId}`)
      .set("Cookie", cookie)
      .send({ modelId: "no-existe" });

    expect(res.status).toBe(404);
    const saved = await prisma.version.findUniqueOrThrow({ where: { id: versionId } });
    expect(saved.modelId).toBe(modelId);
  });

  it("POST /admin/versions (duplicar) crea la versión bajo el modelo elegido", async () => {
    const { brandId } = await seed();
    const corolla = await otherModel(brandId);
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .post("/api/v1/admin/versions")
      .set("Cookie", cookie)
      .send({
        modelId: corolla.id, name: "XLS", year: 2026, priceClp: 14_990_000,
        transmission: "CVT", fuel: "BENCINA", powerHp: 110, torqueNm: 140,
        lengthMm: 3940, widthMm: 1740, heightMm: 1480, weightKg: 1100, trunkLiters: 286,
      });

    expect(res.status).toBe(201);
    const saved = await prisma.version.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(saved.modelId).toBe(corolla.id);
  });

  it("PATCH que además estrena un combustible mueve la versión igual", async () => {
    const { versionId, brandId } = await seed();
    const corolla = await otherModel(brandId);
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .patch(`/api/v1/admin/versions/${versionId}`)
      .set("Cookie", cookie)
      .send({ modelId: corolla.id, fuel: "HIDROGENO" });

    expect(res.status).toBe(200);
    const saved = await prisma.version.findUniqueOrThrow({ where: { id: versionId } });
    expect(saved.modelId).toBe(corolla.id);
    expect(saved.fuel).toBe("HIDROGENO");
  });
});
