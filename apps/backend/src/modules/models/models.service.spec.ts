import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ModelsService } from "./models.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("ModelsService con enums abiertos", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    await prisma.brand.create({ data: { name: "Toyota" } });
  });

  afterEach(async () => {
    // Reset model table only; enum extensions persist across tests (harmless).
    await prisma.model.deleteMany();
  });

  it("create() crea un modelo con un segmento nuevo (extiende enum)", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const newSegment = `TEST_NEW_SEG_${Date.now()}`;
    const created = await svc.create({
      brandId: brand.id,
      name: `Modelo Test ${Date.now()}`,
      segment: newSegment,
      imageUrl: null,
      galleryUrls: [],
    });
    expect(created.segment).toBe(newSegment);
  });

  it("listSegments() devuelve los canónicos más los creados con 'Otro'", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const newSegment = `TEST_FACET_SEG_${Date.now()}`;
    await svc.create({
      brandId: brand.id,
      name: `Modelo Facet ${Date.now()}`,
      segment: newSegment,
      imageUrl: null,
      galleryUrls: [],
    });

    const segments = await svc.listSegments();
    expect(segments.map((s) => s.id)).toContain(newSegment);
    expect(segments.map((s) => s.id)).toEqual(expect.arrayContaining(["SEDAN", "SUV", "PICKUP"]));
    expect(segments.find((s) => s.id === newSegment)?.count).toBe(1);
    // `id` y `name` iguales: es la forma que consume `app-select-search`.
    expect(segments.every((s) => s.id === s.name)).toBe(true);
  });

  it("create() rechaza segmento con formato inválido antes de tocar la DB", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    await expect(
      svc.create({
        brandId: brand.id,
        name: "X",
        segment: "invalid-lowercase",
        imageUrl: null,
        galleryUrls: [],
      }),
    ).rejects.toThrow(/Valor inválido/);
  });

  it("update() extiende el enum cuando se cambia el segmento a un valor nuevo", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const created = await svc.create({
      brandId: brand.id,
      name: "Modelo Update",
      segment: "SEDAN",
      imageUrl: null,
      galleryUrls: [],
    });
    const newSegment = `TEST_UPD_SEG_${Date.now()}`;
    const updated = await svc.update(created.id, { segment: newSegment });
    expect(updated.segment).toBe(newSegment);
  });

  it("list() expone imageUrl con prioridad sobre galleryUrls[0] (regression: cards mostraban galería)", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const name = `Modelo Image ${Date.now()}`;
    await svc.create({
      brandId: brand.id,
      name,
      segment: "SEDAN",
      imageUrl: "/uploads/2026-07/primary.png",
      galleryUrls: ["/uploads/2026-07/one.png", "/uploads/2026-07/two.png"],
    });

    // Inject a version so the enriched response has minPrice etc.
    const model = await prisma.model.findFirstOrThrow({ where: { name } });
    await prisma.version.create({
      data: {
        modelId: model.id,
        name: "1.6",
        year: 2026,
        priceClp: 1000000,
        transmission: "MANUAL",
        fuel: "BENCINA",
        engineDisplacementCc: 0,
        powerHp: 0,
        torqueNm: 0,
        consumptionCityKmL: 0,
        consumptionHighwayKmL: 0,
        lengthMm: 0,
        widthMm: 0,
        heightMm: 0,
        weightKg: 0,
        trunkLiters: 0,
      },
    });

    const res = await svc.list({ page: 1, pageSize: 50, sort: "name", order: "asc" });
    const found = res.items.find((m) => m.name === name)!;
    // Regression: previously returned galleryUrls[0] when imageUrl was set.
    expect(found.imageUrl).toBe("/uploads/2026-07/primary.png");
  });

  it("list() cae a galleryUrls[0] cuando imageUrl es null", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const name = `Modelo Fallback ${Date.now()}`;
    await svc.create({
      brandId: brand.id,
      name,
      segment: "SEDAN",
      imageUrl: null,
      galleryUrls: ["/uploads/2026-07/fallback.png"],
    });

    const model = await prisma.model.findFirstOrThrow({ where: { name } });
    await prisma.version.create({
      data: {
        modelId: model.id,
        name: "1.6",
        year: 2026,
        priceClp: 0,
        transmission: "MANUAL",
        fuel: "BENCINA",
        engineDisplacementCc: 0,
        powerHp: 0,
        torqueNm: 0,
        consumptionCityKmL: 0,
        consumptionHighwayKmL: 0,
        lengthMm: 0,
        widthMm: 0,
        heightMm: 0,
        weightKg: 0,
        trunkLiters: 0,
      },
    });

    const res = await svc.list({ page: 1, pageSize: 50, sort: "name", order: "asc" });
    const found = res.items.find((m) => m.name === name)!;
    expect(found.imageUrl).toBe("/uploads/2026-07/fallback.png");
  });

  it("detail() incluye equipmentItems por versión (necesario para la tabla de Equipamiento)", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const model = await svc.create({
      brandId: brand.id,
      name: `Modelo Equip ${Date.now()}`,
      segment: "SEDAN",
      imageUrl: null,
      galleryUrls: [],
    });
    const version = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "1.6",
        year: 2026,
        priceClp: 1000000,
        transmission: "MANUAL",
        fuel: "BENCINA",
        engineDisplacementCc: 0,
        powerHp: 0,
        torqueNm: 0,
        consumptionCityKmL: 0,
        consumptionHighwayKmL: 0,
        lengthMm: 0,
        widthMm: 0,
        heightMm: 0,
        weightKg: 0,
        trunkLiters: 0,
      },
    });
    const item = await prisma.equipmentItem.create({
      data: { name: "Apple CarPlay", category: "Conectividad" },
    });
    await prisma.versionEquipment.create({
      data: { versionId: version.id, equipmentItemId: item.id },
    });

    const detail = await svc.detail(model.id);
    const v = detail.versions.find((x) => x.id === version.id)!;
    expect(v.equipmentItems).toBeDefined();
    expect(v.equipmentItems.length).toBe(1);
    expect(v.equipmentItems[0]?.equipmentItem.name).toBe("Apple CarPlay");
  });

  it("list() incluye equipmentItems por versión", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const name = `Modelo ListEquip ${Date.now()}`;
    const model = await svc.create({
      brandId: brand.id,
      name,
      segment: "SEDAN",
      imageUrl: null,
      galleryUrls: [],
    });
    const version = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "1.6",
        year: 2026,
        priceClp: 0,
        transmission: "MANUAL",
        fuel: "BENCINA",
        engineDisplacementCc: 0,
        powerHp: 0,
        torqueNm: 0,
        consumptionCityKmL: 0,
        consumptionHighwayKmL: 0,
        lengthMm: 0,
        widthMm: 0,
        heightMm: 0,
        weightKg: 0,
        trunkLiters: 0,
      },
    });
    const item = await prisma.equipmentItem.create({
      data: { name: "Cámara 360°", category: "Seguridad" },
    });
    await prisma.versionEquipment.create({
      data: { versionId: version.id, equipmentItemId: item.id },
    });

    const res = await svc.list({ page: 1, pageSize: 50, sort: "name", order: "asc" });
    const found = res.items.find((m) => m.name === name)!;
    const v = found.versions.find((x) => x.id === version.id)!;
    expect(v.equipmentItems).toBeDefined();
    expect(v.equipmentItems?.length).toBe(1);
    expect(v.equipmentItems?.[0]?.equipmentItem.name).toBe("Cámara 360°");
  });

  it("listPaged() trae equipmentItems del modelo para prellenar el diálogo admin", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const model = await prisma.model.create({
      data: { brandId: brand.id, name: `M-paged-${Date.now()}`, segment: "SUV" },
    });
    const item = await prisma.equipmentItem.create({
      data: { name: `Sensor de retroceso ${Date.now()}`, category: "Seguridad" },
    });
    await prisma.modelEquipment.create({ data: { modelId: model.id, equipmentItemId: item.id } });

    const { rows } = await svc.listPaged(undefined, { skip: 0, take: 50, page: 1, pageSize: 50 });
    const found = rows.find((m) => m.id === model.id)!;
    expect(found.equipmentItems.map((e) => e.equipmentItem.id)).toEqual([item.id]);
  });

  it("list()/detail() incluyen el equipamiento heredado de la marca y del modelo", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.create({ data: { name: `B-herencia-${Date.now()}` } });
    const model = await prisma.model.create({
      data: { brandId: brand.id, name: `M-herencia-${Date.now()}`, segment: "SUV" },
    });
    const version = await prisma.version.create({
      data: {
        modelId: model.id, name: "Base", year: 2026, priceClp: 1,
        transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1,
        consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1,
      },
    });
    const deMarca = await prisma.equipmentItem.create({
      data: { name: `ABS ${Date.now()}`, category: "Seguridad" },
    });
    const deModelo = await prisma.equipmentItem.create({
      data: { name: `Bluetooth ${Date.now()}`, category: "Multimedia" },
    });
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: deMarca.id } });
    await prisma.modelEquipment.create({ data: { modelId: model.id, equipmentItemId: deModelo.id } });

    const detail = await svc.detail(model.id);
    const detailIds = detail.versions
      .find((v) => v.id === version.id)!
      .equipmentItems.map((e) => e.equipmentItem.id)
      .sort();
    expect(detailIds).toEqual([deMarca.id, deModelo.id].sort());

    const res = await svc.list({ page: 1, pageSize: 50, sort: "name", order: "asc" });
    const listIds = res.items
      .find((m) => m.id === model.id)!
      .versions.find((v) => v.id === version.id)!
      .equipmentItems.map((e) => e.equipmentItem.id)
      .sort();
    expect(listIds).toEqual([deMarca.id, deModelo.id].sort());
  });

  it("detail() respeta la exclusión de una versión sobre el equipamiento de la marca", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.create({ data: { name: `B-excl-${Date.now()}` } });
    const model = await prisma.model.create({
      data: { brandId: brand.id, name: `M-excl-${Date.now()}`, segment: "SUV" },
    });
    const version = await prisma.version.create({
      data: {
        modelId: model.id, name: "Base", year: 2026, priceClp: 1,
        transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1,
        consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1,
      },
    });
    const item = await prisma.equipmentItem.create({
      data: { name: `Techo solar ${Date.now()}`, category: "Confort" },
    });
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: item.id } });
    await prisma.versionEquipmentExclusion.create({
      data: { versionId: version.id, equipmentItemId: item.id },
    });

    const detail = await svc.detail(model.id);
    expect(detail.versions.find((v) => v.id === version.id)!.equipmentItems).toEqual([]);
  });
});
describe("ModelsService.detailBySlug", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("encuentra un modelo por brand+model slug case-insensitive y con acentos", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const model = await prisma.model.create({
      data: { name: "Corolla", brandId: brand.id, segment: "SEDAN" },
    });
    const detail = await svc.detailBySlug("toyota", "corolla");
    expect(detail).not.toBeNull();
    expect(detail!.id).toBe(model.id);
  });

  it("normaliza acentos y espacios", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Mañé" } });
    await prisma.model.create({
      data: { name: "Compacto X", brandId: brand.id, segment: "HATCHBACK" },
    });
    const detail = await svc.detailBySlug("mane", "compacto-x");
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe("Compacto X");
  });

  it("retorna null si el slug no coincide", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    await prisma.model.create({
      data: { name: "Corolla", brandId: brand.id, segment: "SEDAN" },
    });
    expect(await svc.detailBySlug("toyota", "yaris")).toBeNull();
    expect(await svc.detailBySlug("honda", "corolla")).toBeNull();
  });
});
