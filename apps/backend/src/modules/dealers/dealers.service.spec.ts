import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { DealersService } from "./dealers.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";

describe("DealersService", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("create crea un dealer con name, url, logoUrl opcional", async () => {
    const svc = new DealersService(prisma);
    const dealer = await svc.create({ name: "Derco", url: "https://derco.cl" });
    expect(dealer.name).toBe("Derco");
    expect(dealer.url).toBe("https://derco.cl");
    expect(dealer.logoUrl).toBeNull();
  });

  it("byBrand retorna solo dealers asociados a la marca vía BrandDealer", async () => {
    const svc = new DealersService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const dealerA = await svc.create({ name: "Derco", url: "https://derco.cl" });
    const dealerB = await svc.create({ name: "Salazar Israel", url: "https://salazar.cl" });
    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerA.id } });
    const result = await svc.byBrand(brand.id);
    expect(result.map((d) => d.id)).toEqual([dealerA.id]);
    expect(result[0]?.name).toBe("Derco");
  });

  it("softDelete setea deletedAt", async () => {
    const svc = new DealersService(prisma);
    const dealer = await svc.create({ name: "Derco", url: "https://derco.cl" });
    await svc.softDelete(dealer.id);
    const after = await prisma.dealer.findUnique({ where: { id: dealer.id } });
    expect(after?.deletedAt).not.toBeNull();
  });

  it("listAll excluye dealers soft-deleted", async () => {
    const svc = new DealersService(prisma);
    await svc.create({ name: "A", url: "https://a.cl" });
    const b = await svc.create({ name: "B", url: "https://b.cl" });
    await svc.softDelete(b.id);
    const all = await svc.listAll();
    expect(all.map((d) => d.name)).toEqual(["A"]);
  });
});
