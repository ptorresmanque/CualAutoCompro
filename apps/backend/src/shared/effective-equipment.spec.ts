import { beforeEach, describe, expect, it } from "vitest";
import { resetTestDb, setupTestPrisma } from "../../__tests__/helpers/db.js";
import { prisma } from "../infra/prisma.js";
import {
  inheritedEquipmentIds,
  resolveEffectiveEquipment,
  type VersionEquipmentRef,
} from "./effective-equipment.js";

const versionData = (modelId: string, name: string) => ({
  modelId,
  name,
  year: 2026,
  priceClp: 1_000_000,
  transmission: "MANUAL",
  fuel: "BENCINA",
  engineDisplacementCc: 1, powerHp: 1, torqueNm: 1,
  consumptionCityKmL: 1, consumptionHighwayKmL: 1,
  lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1,
  trunkLiters: 1,
});

describe("resolveEffectiveEquipment", () => {
  let ref: VersionEquipmentRef;
  let airbag: string;
  let camara: string;
  let techo: string;

  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);

    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const model = await prisma.model.create({
      data: { brandId: brand.id, name: "Corolla", segment: "SEDAN" },
    });
    const version = await prisma.version.create({ data: versionData(model.id, "XLI") });
    ref = { versionId: version.id, modelId: model.id, brandId: brand.id };

    const items = await Promise.all([
      prisma.equipmentItem.create({ data: { name: "Airbag conductor", category: "Seguridad" } }),
      prisma.equipmentItem.create({ data: { name: "Cámara 360", category: "Seguridad" } }),
      prisma.equipmentItem.create({ data: { name: "Techo panorámico", category: "Confort" } }),
    ]);
    [airbag, camara, techo] = items.map((i) => i.id) as [string, string, string];
  });

  it("devuelve un Map vacío sin refs y no toca la DB", async () => {
    expect(await resolveEffectiveEquipment(prisma, [])).toEqual(new Map());
  });

  it("une equipamiento propio, del modelo y de la marca", async () => {
    await prisma.versionEquipment.create({
      data: { versionId: ref.versionId, equipmentItemId: techo },
    });
    await prisma.modelEquipment.create({
      data: { modelId: ref.modelId, equipmentItemId: camara },
    });
    await prisma.brandEquipment.create({
      data: { brandId: ref.brandId, equipmentItemId: airbag },
    });

    const entries = (await resolveEffectiveEquipment(prisma, [ref])).get(ref.versionId)!;

    // Ordenado por categoría y luego nombre: Confort < Seguridad.
    expect(entries.map((e) => [e.equipmentItem.name, e.source, e.sourceName])).toEqual([
      ["Techo panorámico", "VERSION", null],
      ["Airbag conductor", "BRAND", "Toyota"],
      ["Cámara 360", "MODEL", "Corolla"],
    ]);
  });

  it("aplica la precedencia VERSION > MODEL > BRAND al deduplicar", async () => {
    await Promise.all([
      prisma.versionEquipment.create({
        data: { versionId: ref.versionId, equipmentItemId: airbag },
      }),
      prisma.modelEquipment.create({ data: { modelId: ref.modelId, equipmentItemId: airbag } }),
      prisma.brandEquipment.create({ data: { brandId: ref.brandId, equipmentItemId: airbag } }),
      prisma.modelEquipment.create({ data: { modelId: ref.modelId, equipmentItemId: camara } }),
      prisma.brandEquipment.create({ data: { brandId: ref.brandId, equipmentItemId: camara } }),
    ]);

    const entries = (await resolveEffectiveEquipment(prisma, [ref])).get(ref.versionId)!;

    expect(entries).toHaveLength(2);
    expect(entries.find((e) => e.equipmentItem.id === airbag)?.source).toBe("VERSION");
    expect(entries.find((e) => e.equipmentItem.id === camara)?.source).toBe("MODEL");
  });

  it("resta las exclusiones de la versión", async () => {
    await prisma.brandEquipment.create({
      data: { brandId: ref.brandId, equipmentItemId: airbag },
    });
    await prisma.versionEquipmentExclusion.create({
      data: { versionId: ref.versionId, equipmentItemId: airbag },
    });

    expect((await resolveEffectiveEquipment(prisma, [ref])).get(ref.versionId)).toEqual([]);
  });

  it("omite los ítems con soft delete", async () => {
    await prisma.brandEquipment.create({
      data: { brandId: ref.brandId, equipmentItemId: airbag },
    });
    await prisma.versionEquipment.create({
      data: { versionId: ref.versionId, equipmentItemId: camara },
    });
    await prisma.equipmentItem.updateMany({
      where: { id: { in: [airbag, camara] } },
      data: { deletedAt: new Date() },
    });

    expect((await resolveEffectiveEquipment(prisma, [ref])).get(ref.versionId)).toEqual([]);
  });

  it("resuelve versiones de marcas distintas en una sola llamada", async () => {
    const otherBrand = await prisma.brand.create({ data: { name: "Kia" } });
    const otherModel = await prisma.model.create({
      data: { brandId: otherBrand.id, name: "Rio", segment: "SEDAN" },
    });
    const otherVersion = await prisma.version.create({ data: versionData(otherModel.id, "LX") });
    const otherRef: VersionEquipmentRef = {
      versionId: otherVersion.id,
      modelId: otherModel.id,
      brandId: otherBrand.id,
    };

    await prisma.brandEquipment.create({
      data: { brandId: ref.brandId, equipmentItemId: airbag },
    });
    await prisma.brandEquipment.create({
      data: { brandId: otherBrand.id, equipmentItemId: camara },
    });

    const map = await resolveEffectiveEquipment(prisma, [ref, otherRef]);

    expect(map.get(ref.versionId)?.map((e) => e.equipmentItem.id)).toEqual([airbag]);
    expect(map.get(otherRef.versionId)?.map((e) => e.equipmentItem.id)).toEqual([camara]);
  });

  it("no incluye una versión sin equipamiento en el Map con entradas", async () => {
    const map = await resolveEffectiveEquipment(prisma, [ref]);
    expect(map.get(ref.versionId)).toEqual([]);
  });
});

describe("inheritedEquipmentIds", () => {
  it("une los ids del modelo y de la marca, sin los soft-deleted", async () => {
    setupTestPrisma();
    await resetTestDb(prisma);

    const brand = await prisma.brand.create({ data: { name: "Mazda" } });
    const model = await prisma.model.create({
      data: { brandId: brand.id, name: "3", segment: "SEDAN" },
    });
    const [deMarca, deModelo, borrado] = await Promise.all([
      prisma.equipmentItem.create({ data: { name: "Cruise control", category: "Confort" } }),
      prisma.equipmentItem.create({ data: { name: "Sensor de lluvia", category: "Confort" } }),
      prisma.equipmentItem.create({
        data: { name: "Radio CD", category: "Multimedia", deletedAt: new Date() },
      }),
    ]);
    await Promise.all([
      prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: deMarca.id } }),
      prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: borrado.id } }),
      prisma.modelEquipment.create({ data: { modelId: model.id, equipmentItemId: deModelo.id } }),
    ]);

    const ids = await inheritedEquipmentIds(prisma, model.id, brand.id);

    expect([...ids].sort()).toEqual([deMarca.id, deModelo.id].sort());
  });
});
