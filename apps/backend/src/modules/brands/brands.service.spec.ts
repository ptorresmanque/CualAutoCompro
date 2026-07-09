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
});
