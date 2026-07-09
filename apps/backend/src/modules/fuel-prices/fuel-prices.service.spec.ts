import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { FuelPricesService } from "./fuel-prices.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";

describe("FuelPricesService", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("create guarda pricePerUnitClp + unit", async () => {
    const svc = new FuelPricesService(prisma);
    const result = await svc.create({
      fuelType: "BENCINA",
      pricePerUnitClp: 1280,
      unit: "L",
    });
    expect(result.fuelType).toBe("BENCINA");
    expect(result.pricePerUnitClp).toBe(1280);
  });

  it("current retorna el precio más reciente por fuelType", async () => {
    const svc = new FuelPricesService(prisma);
    await svc.create({ fuelType: "BENCINA", pricePerUnitClp: 1200, unit: "L" });
    await new Promise((r) => setTimeout(r, 5));
    await svc.create({ fuelType: "BENCINA", pricePerUnitClp: 1300, unit: "L" });
    const current = await svc.current();
    const bencina = current.find((c) => c.fuelType === "BENCINA");
    expect(bencina?.pricePerUnitClp).toBe(1300);
  });

  it("current agrupa por fuelType", async () => {
    const svc = new FuelPricesService(prisma);
    await svc.create({ fuelType: "BENCINA", pricePerUnitClp: 1200, unit: "L" });
    await svc.create({ fuelType: "ELECTRIC", pricePerUnitClp: 350, unit: "kWh" });
    const current = await svc.current();
    expect(current).toHaveLength(2);
    expect(current.map((c) => c.fuelType).sort()).toEqual(["BENCINA", "ELECTRIC"]);
  });

  it("softDelete setea deletedAt", async () => {
    const svc = new FuelPricesService(prisma);
    const fp = await svc.create({ fuelType: "DIESEL", pricePerUnitClp: 1100, unit: "L" });
    await svc.softDelete(fp.id);
    const after = await prisma.fuelPrice.findUnique({ where: { id: fp.id } });
    expect(after?.deletedAt).not.toBeNull();
  });
});
