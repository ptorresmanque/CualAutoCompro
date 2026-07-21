import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { BrandsService } from "./brands.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";

describe("BrandsService.update dealerIds sync", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("update con dealerIds[] reemplaza la lista completa de BrandDealer", async () => {
    const svc = new BrandsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const dealerA = await prisma.dealer.create({ data: { name: "Derco", url: "https://derco.cl" } });
    const dealerB = await prisma.dealer.create({ data: { name: "Salazar", url: "https://salazar.cl" } });
    const dealerC = await prisma.dealer.create({ data: { name: "Rosselot", url: "https://rosselot.cl" } });

    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerA.id } });
    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerB.id } });

    await svc.update(brand.id, { dealerIds: [dealerB.id, dealerC.id] });

    const relations = await prisma.brandDealer.findMany({ where: { brandId: brand.id } });
    expect(relations.map((r) => r.dealerId).sort()).toEqual([dealerB.id, dealerC.id].sort());
  });

  it("update sin dealerIds no toca las relaciones existentes", async () => {
    const svc = new BrandsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const dealerA = await prisma.dealer.create({ data: { name: "Derco", url: "https://derco.cl" } });
    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerA.id } });

    await svc.update(brand.id, { name: "Toyota Chile" });

    const relations = await prisma.brandDealer.findMany({ where: { brandId: brand.id } });
    expect(relations).toHaveLength(1);
  });

  it("update con dealerIds: [] elimina todas las relaciones BrandDealer", async () => {
    const svc = new BrandsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const dealerA = await prisma.dealer.create({ data: { name: "Derco", url: "https://derco.cl" } });
    const dealerB = await prisma.dealer.create({ data: { name: "Salazar", url: "https://salazar.cl" } });
    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerA.id } });
    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerB.id } });

    await svc.update(brand.id, { dealerIds: [] });

    const remaining = await prisma.brandDealer.count({ where: { brandId: brand.id } });
    expect(remaining).toBe(0);
  });
});

describe("BrandsService.bulkDelete", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("marca deletedAt en las marcas indicadas", async () => {
    const svc = new BrandsService(prisma);
    const a = await prisma.brand.create({ data: { name: "A" } });
    const b = await prisma.brand.create({ data: { name: "B" } });
    const c = await prisma.brand.create({ data: { name: "C" } });

    const result = await svc.bulkDelete([a.id, b.id]);

    expect(result.deleted).toBe(2);
    expect(result.failed).toEqual([]);

    const remaining = await prisma.brand.findMany({ where: { id: { in: [a.id, b.id, c.id] } } });
    expect(remaining.find((r) => r.id === a.id)?.deletedAt).not.toBeNull();
    expect(remaining.find((r) => r.id === b.id)?.deletedAt).not.toBeNull();
    expect(remaining.find((r) => r.id === c.id)?.deletedAt).toBeNull();
  });

  it("recolecta fallos por marca sin abortar el resto", async () => {
    const svc = new BrandsService(prisma);
    const a = await prisma.brand.create({ data: { name: "A" } });
    // 'fake-id' no existe -> softDelete tira CONFLICT via BRAND_HAS_MODELS o NOT_FOUND;
    // aquí no hay modelos asociados así que tira NOT_FOUND via P2025.
    const result = await svc.bulkDelete([a.id, "missing-id"]);

    expect(result.deleted).toBe(1);
    expect(result.failed.length).toBe(1);
    expect(result.failed[0]!.id).toBe("missing-id");
    expect(typeof result.failed[0]!.reason).toBe('string');
  });

  it("rechaza borrar marca con modelos activos (BRAND_HAS_MODELS)", async () => {
    const svc = new BrandsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    await prisma.model.create({
      data: { name: "Corolla", brandId: brand.id, segment: "SEDAN" },
    });

    const result = await svc.bulkDelete([brand.id]);

    expect(result.deleted).toBe(0);
    expect(result.failed.length).toBe(1);
    expect(result.failed[0]!.reason).toContain("modelos asociados");
  });
});
