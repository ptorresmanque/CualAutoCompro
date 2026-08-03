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
  return { brand, model, version, a, b, c };
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
    expect(res.body.data).toEqual({ attached: 1, detached: 1, excluded: 0 });
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
    expect(res.body.data).toEqual({ attached: 0, detached: 0, excluded: 0 });
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

    expect(res.body.data).toEqual({ attached: 0, detached: 2, excluded: 0 });
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

  it("una versión recién creada hereda lo de su marca en vez de excluirlo", async () => {
    const { brand, model, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: c.id } });

    // El alta: el diálogo de creación no muestra lo heredado (todavía no hay
    // versión que resolver), así que manda la selección vacía y sin
    // `knownInheritedIds`. Eso no puede leerse como "excluir todo".
    const nueva = await prisma.version.create({
      data: { ...baseVersion, modelId: model.id, name: "Recién creada" },
    });
    const res = await request(app)
      .put(`/api/v1/admin/equipment/version/${nueva.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ attached: 0, detached: 0, excluded: 0 });
    expect(await prisma.versionEquipmentExclusion.count({ where: { versionId: nueva.id } })).toBe(0);

    const detail = await request(app).get(`/api/v1/versions/${nueva.id}`);
    expect(detail.body.data.equipmentItems.map((e: { equipmentItem: { id: string } }) => e.equipmentItem.id))
      .toContain(c.id);
  });

  it("lo que el form mostró como heredado no se guarda como propio de la versión", async () => {
    const { brand, model, version, a, b, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: c.id } });

    // El admin cambia la versión de modelo (a uno de otra marca) sin tocar los
    // chips: los heredados que se mostraban ya no se heredan, pero tampoco
    // deben quedar cargados a mano en la versión.
    const otraMarca = await prisma.brand.create({ data: { name: "Nissan" } });
    const otroModelo = await prisma.model.create({
      data: { brandId: otraMarca.id, name: "Versa", segment: "SEDAN" },
    });
    await prisma.version.update({ where: { id: version.id }, data: { modelId: otroModelo.id } });

    await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [a.id, b.id, c.id], knownInheritedIds: [c.id] });

    expect(await attachedIds(version.id)).toEqual([a.id, b.id].sort());
    expect(await prisma.model.count({ where: { id: model.id } })).toBe(1);
  });

  it("quitar un ítem heredado de la marca crea una exclusión, no borra la asociación de marca", async () => {
    const { brand, version, a, b, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: c.id } });

    // El form muestra a, b (propios) y c (heredado); el admin saca c.
    const res = await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [a.id, b.id], knownInheritedIds: [c.id] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ attached: 0, detached: 0, excluded: 1 });
    expect(await attachedIds(version.id)).toEqual([a.id, b.id].sort());
    expect(await prisma.brandEquipment.count({ where: { brandId: brand.id } })).toBe(1);
  });

  it("un ítem heredado que sigue seleccionado no se guarda como propio", async () => {
    const { brand, version, a, b, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: c.id } });

    const res = await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [a.id, b.id, c.id] });

    expect(res.body.data).toEqual({ attached: 0, detached: 0, excluded: 0 });
    expect(await attachedIds(version.id)).toEqual([a.id, b.id].sort());
  });

  it("un ítem que ya era propio sigue siendo propio aunque la marca lo agregue después", async () => {
    const { brand, version, a, b } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: a.id } });

    await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [a.id, b.id] });

    expect(await attachedIds(version.id)).toEqual([a.id, b.id].sort());
  });

  it("volver a seleccionar un ítem excluido borra la exclusión", async () => {
    const { brand, version, a, b, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: c.id } });
    await prisma.versionEquipmentExclusion.create({
      data: { versionId: version.id, equipmentItemId: c.id },
    });

    await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [a.id, b.id, c.id] });

    expect(await prisma.versionEquipmentExclusion.count({ where: { versionId: version.id } })).toBe(0);
  });

  it("una exclusión de un ítem que ya no se hereda sobrevive al sync", async () => {
    const { version, a, b, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    // `c` fue excluido cuando la marca lo traía; ya no está en la marca.
    await prisma.versionEquipmentExclusion.create({
      data: { versionId: version.id, equipmentItemId: c.id },
    });

    await request(app)
      .put(`/api/v1/admin/equipment/version/${version.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [a.id, b.id] });

    expect(await prisma.versionEquipmentExclusion.count({ where: { versionId: version.id } })).toBe(1);
  });
});

describe("PUT /api/v1/admin/equipment/brand/:brandId", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("sin auth → 401", async () => {
    const res = await request(createApp()).put("/api/v1/admin/equipment/brand/x").send({ itemIds: [] });
    expect(res.status).toBe(401);
  });

  it("sincroniza el equipamiento de serie y lo heredan las versiones", async () => {
    const { brand, version, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/equipment/brand/${brand.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [c.id] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ attached: 1, detached: 0 });

    const detail = await request(app).get(`/api/v1/versions/${version.id}`);
    expect(detail.body.data.equipmentItems.map((e: { equipmentItem: { id: string } }) => e.equipmentItem.id))
      .toContain(c.id);
  });

  it("marca inexistente → 404", async () => {
    const { c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put("/api/v1/admin/equipment/brand/no-existe")
      .set("Cookie", cookie)
      .send({ itemIds: [c.id] });

    expect(res.status).toBe(404);
  });

  it("lista vacía desasocia todo", async () => {
    const { brand, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: c.id } });

    const res = await request(app)
      .put(`/api/v1/admin/equipment/brand/${brand.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [] });

    expect(res.body.data).toEqual({ attached: 0, detached: 1 });
    expect(await prisma.brandEquipment.count({ where: { brandId: brand.id } })).toBe(0);
  });
});

describe("PUT /api/v1/admin/equipment/model/:modelId", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("sincroniza el equipamiento de serie del modelo", async () => {
    const { model, version, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put(`/api/v1/admin/equipment/model/${model.id}`)
      .set("Cookie", cookie)
      .send({ itemIds: [c.id] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ attached: 1, detached: 0 });

    const detail = await request(app).get(`/api/v1/versions/${version.id}`);
    expect(detail.body.data.equipmentItems.map((e: { equipmentItem: { id: string } }) => e.equipmentItem.id))
      .toContain(c.id);
  });

  it("modelo inexistente → 404", async () => {
    const { c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .put("/api/v1/admin/equipment/model/no-existe")
      .set("Cookie", cookie)
      .send({ itemIds: [c.id] });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/admin/equipment/:id con asociaciones de marca/modelo", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("no deja borrar un ítem asociado a una marca", async () => {
    const { brand, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    await prisma.brandEquipment.create({ data: { brandId: brand.id, equipmentItemId: c.id } });

    const res = await request(app)
      .delete(`/api/v1/admin/equipment/${c.id}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(409);
    // `details` se spreadea dentro de `error` — ver shared/response.ts.
    expect(res.body.error).toMatchObject({
      code: "EQUIPMENT_IN_USE",
      brandCount: 1,
      modelCount: 0,
      versionCount: 0,
    });
    expect((await prisma.equipmentItem.findUnique({ where: { id: c.id } }))?.deletedAt).toBeNull();
  });

  it("no deja borrar un ítem asociado a un modelo", async () => {
    const { model, c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    await prisma.modelEquipment.create({ data: { modelId: model.id, equipmentItemId: c.id } });

    const res = await request(app)
      .delete(`/api/v1/admin/equipment/${c.id}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: "EQUIPMENT_IN_USE", modelCount: 1 });
  });

  it("deja borrar un ítem sin asociaciones", async () => {
    const { c } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);

    const res = await request(app)
      .delete(`/api/v1/admin/equipment/${c.id}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect((await prisma.equipmentItem.findUnique({ where: { id: c.id } }))?.deletedAt).not.toBeNull();
  });
});
