import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

const seed = async () => {
  const toyota = await prisma.brand.create({ data: { name: "Toyota" } });
  const yaris = await prisma.model.create({ data: { brandId: toyota.id, name: "Yaris", segment: "HATCHBACK" } });
  await prisma.version.create({
    data: {
      modelId: yaris.id, name: "XLS", year: 2026, priceClp: 14_990_000,
      transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1496,
      powerHp: 110, torqueNm: 140, consumptionCityKmL: 14, consumptionHighwayKmL: 19,
      lengthMm: 3940, widthMm: 1740, heightMm: 1480, weightKg: 1100, trunkLiters: 286,
    },
  });
  await prisma.version.create({
    data: {
      modelId: yaris.id, name: "Sport", year: 2025, priceClp: 11_500_000,
      transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1496,
      powerHp: 110, torqueNm: 140, consumptionCityKmL: 18, consumptionHighwayKmL: 22,
      lengthMm: 3940, widthMm: 1740, heightMm: 1480, weightKg: 1080, trunkLiters: 286,
    },
  });
  const mazda = await prisma.brand.create({ data: { name: "Mazda" } });
  await prisma.model.create({ data: { brandId: mazda.id, name: "CX-5", segment: "SUV" } });
};

describe("GET /api/v1/models", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    await seed();
  });

  it("lista modelos paginados", async () => {
    const res = await request(createApp()).get("/api/v1/models");
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it("filtra por brand (id)", async () => {
    const toyota = await prisma.brand.findFirst({ where: { name: "Toyota" } });
    const res = await request(createApp()).get(`/api/v1/models?brand=${toyota!.id}`);
    expect(res.body.data.items.every((m: { brandId: string }) => m.brandId === toyota!.id)).toBe(true);
  });

  it("filtra por segment=HATCHBACK", async () => {
    const res = await request(createApp()).get("/api/v1/models?segment=HATCHBACK");
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items.every((m: { segment: string }) => m.segment === "HATCHBACK")).toBe(true);
  });

  it("filtra por un segmento no canónico creado con 'Otro' (antes daba 400)", async () => {
    const toyota = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    await prisma.model.create({
      data: { brandId: toyota.id, name: "Hiace", segment: "MINI_VAN" },
    });
    const res = await request(createApp()).get("/api/v1/models?segment=MINI_VAN");
    expect(res.status).toBe(200);
    expect(res.body.data.items.map((m: { name: string }) => m.name)).toEqual(["Hiace"]);
  });

  it("rechaza un segmento con formato inválido", async () => {
    const res = await request(createApp()).get("/api/v1/models?segment=mini%20van");
    expect(res.status).toBe(400);
  });

  // Multi-selección: el catálogo manda los tokens separados por coma cuando el
  // usuario marca más de una opción ("SUV o Crossover").
  describe("multi-selección por CSV", () => {
    it("segment acepta varios tokens y devuelve la unión", async () => {
      const res = await request(createApp()).get("/api/v1/models?segment=HATCHBACK,SUV");
      expect(res.status).toBe(200);
      const segments = res.body.data.items.map((m: { segment: string }) => m.segment);
      expect(segments.length).toBeGreaterThanOrEqual(2);
      expect(new Set(segments)).toEqual(new Set(["HATCHBACK", "SUV"]));
    });

    it("un solo token sigue funcionando igual que antes", async () => {
      const res = await request(createApp()).get("/api/v1/models?segment=SUV");
      expect(res.status).toBe(200);
      expect(
        res.body.data.items.every((m: { segment: string }) => m.segment === "SUV"),
      ).toBe(true);
    });

    it("tolera espacios y comas sobrantes", async () => {
      const res = await request(createApp()).get("/api/v1/models?segment=%20SUV%20,,HATCHBACK,");
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it("rechaza la lista si algún token tiene formato inválido", async () => {
      const res = await request(createApp()).get("/api/v1/models?segment=SUV,mini%20van");
      expect(res.status).toBe(400);
    });

    it("rechaza una lista vacía", async () => {
      const res = await request(createApp()).get("/api/v1/models?segment=,,");
      expect(res.status).toBe(400);
    });

    it("fuel acepta varios combustibles", async () => {
      const toyota = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
      const prius = await prisma.model.create({
        data: { brandId: toyota.id, name: "Prius", segment: "HATCHBACK" },
      });
      await prisma.version.create({
        data: { modelId: prius.id, name: "Hybrid", year: 2026, priceClp: 25000000,
          transmission: "CVT", fuel: "HYBRID", engineDisplacementCc: 1800, powerHp: 120,
          torqueNm: 142, consumptionCityKmL: 24, consumptionHighwayKmL: 26,
          lengthMm: 4600, widthMm: 1780, heightMm: 1470, weightKg: 1400, trunkLiters: 500 },
      });

      const soloHybrid = await request(createApp()).get("/api/v1/models?fuel=HYBRID");
      expect(soloHybrid.body.data.items.map((m: { name: string }) => m.name)).toEqual(["Prius"]);

      const ambos = await request(createApp()).get("/api/v1/models?fuel=HYBRID,BENCINA");
      const names = ambos.body.data.items.map((m: { name: string }) => m.name);
      expect(names).toContain("Prius");
      expect(names).toContain("Yaris");
    });

    it("transmission acepta varias cajas", async () => {
      const res = await request(createApp()).get("/api/v1/models?transmission=MANUAL,CVT");
      expect(res.status).toBe(200);
      // Yaris tiene una versión CVT y otra MANUAL: entra por las dos.
      expect(res.body.data.items.map((m: { name: string }) => m.name)).toContain("Yaris");
    });
  });

  it("GET /api/v1/models/segments lista canónicos y creados, sin chocar con /:id", async () => {
    const toyota = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    await prisma.model.create({
      data: { brandId: toyota.id, name: "Hiace", segment: "MINI_VAN" },
    });
    const res = await request(createApp()).get("/api/v1/models/segments");
    expect(res.status).toBe(200);
    const ids = res.body.data.map((s: { id: string }) => s.id);
    expect(ids).toContain("MINI_VAN");
    expect(ids).toEqual(expect.arrayContaining(["SEDAN", "SUV", "HATCHBACK"]));
  });

  it("filtra por rango de precio desde versions", async () => {
    const res = await request(createApp()).get("/api/v1/models?priceMin=14000000");
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });

  describe("defaultVersion enrichment", () => {
    it("Yaris expone defaultVersion con la versión de menor precio (Sport 11.5M)", async () => {
      const res = await request(createApp()).get("/api/v1/models");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeDefined();
      expect(yaris.defaultVersion).not.toBeNull();
      expect(yaris.defaultVersion.name).toBe("Sport");
      expect(yaris.defaultVersion.priceClp).toBe(11_500_000);
      expect(yaris.defaultVersion.year).toBe(2025);
      expect(typeof yaris.defaultVersion.id).toBe("string");
    });

    it("CX-5 (sin versiones) expone defaultVersion null", async () => {
      const res = await request(createApp()).get("/api/v1/models");
      const cx5 = res.body.data.items.find((m: { name: string }) => m.name === "CX-5");
      expect(cx5).toBeDefined();
      expect(cx5.defaultVersion).toBeNull();
    });
  });

  describe("filtro consumptionMax (DB-level, semántica some)", () => {
    it("incluye modelos con al menos una versión que cumple consumptionMax=15 (Yaris:XLS 14≤15)", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionMax=15");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeDefined();
    });

    it("excluye modelos cuando ninguna versión cumple consumptionMax=10 (Yaris:XLS 14>10, Sport 18>10)", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionMax=10");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeUndefined();
    });

    it("incluye modelos cuando ambas versiones cumplen consumptionMax=25", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionMax=25");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeDefined();
    });

    it("excluye modelos sin versiones (Mazda CX-5) incluso con consumptionMax permisivo", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionMax=100");
      const cx5 = res.body.data.items.find((m: { name: string }) => m.name === "CX-5");
      expect(cx5).toBeUndefined();
    });
  });

  describe("filtro consumptionHighwayMax (DB-level, semántica some)", () => {
    it("incluye modelos con al menos una versión que cumple consumptionHighwayMax=20 (Yaris:XLS 19≤20)", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionHighwayMax=20");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeDefined();
    });

    it("excluye modelos cuando ninguna versión cumple consumptionHighwayMax=15 (Yaris:XLS 19>15, Sport 22>15)", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionHighwayMax=15");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeUndefined();
    });

    it("incluye modelos cuando ambas versiones cumplen consumptionHighwayMax=25", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionHighwayMax=25");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeDefined();
    });

    it("excluye modelos sin versiones (Mazda CX-5) incluso con consumptionHighwayMax permisivo", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionHighwayMax=100");
      const cx5 = res.body.data.items.find((m: { name: string }) => m.name === "CX-5");
      expect(cx5).toBeUndefined();
    });
  });
});

describe("GET /api/v1/models sort + order + minConsumption", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  async function seedModels() {
    const b = await prisma.brand.create({ data: { name: "T" } });
    const a = await prisma.model.create({ data: { brandId: b.id, name: "Alpha", segment: "SEDAN" } });
    const c = await prisma.model.create({ data: { brandId: b.id, name: "Charlie", segment: "SUV" } });
    const z = await prisma.model.create({ data: { brandId: b.id, name: "Zeta", segment: "HATCHBACK" } });
    await prisma.version.create({
      data: { modelId: a.id, name: "A1", year: 2026, priceClp: 20000000, transmission: "AUTOMATIC", fuel: "BENCINA",
        engineDisplacementCc: 1500, powerHp: 120, torqueNm: 145, consumptionCityKmL: 10, consumptionHighwayKmL: 14,
        lengthMm: 4200, widthMm: 1760, heightMm: 1480, weightKg: 1100, trunkLiters: 360 },
    });
    await prisma.version.create({
      data: { modelId: c.id, name: "C1", year: 2026, priceClp: 15000000, transmission: "AUTOMATIC", fuel: "BENCINA",
        engineDisplacementCc: 2000, powerHp: 150, torqueNm: 200, consumptionCityKmL: 14, consumptionHighwayKmL: 18,
        lengthMm: 4500, widthMm: 1850, heightMm: 1500, weightKg: 1300, trunkLiters: 420 },
    });
    await prisma.version.create({
      data: { modelId: z.id, name: "Z1", year: 2026, priceClp: 10000000, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1200, powerHp: 80, torqueNm: 110, consumptionCityKmL: 16, consumptionHighwayKmL: 20,
        lengthMm: 4000, widthMm: 1700, heightMm: 1450, weightKg: 1000, trunkLiters: 320 },
    });
    return { a, c, z };
  }

  it("default ordena por nombre asc", async () => {
    await seedModels();
    const res = await request(createApp()).get("/api/v1/models");
    expect(res.status).toBe(200);
    const names = res.body.data.items.map((m: { name: string }) => m.name);
    expect(names).toEqual(["Alpha", "Charlie", "Zeta"]);
  });

  it("sort=minPrice&order=asc ordena por menor precio", async () => {
    await seedModels();
    const res = await request(createApp()).get("/api/v1/models?sort=minPrice&order=asc");
    const names = res.body.data.items.map((m: { name: string }) => m.name);
    expect(names).toEqual(["Zeta", "Charlie", "Alpha"]);
  });

  it("sort=minPrice&order=desc ordena por mayor precio", async () => {
    await seedModels();
    const res = await request(createApp()).get("/api/v1/models?sort=minPrice&order=desc");
    const names = res.body.data.items.map((m: { name: string }) => m.name);
    expect(names).toEqual(["Alpha", "Charlie", "Zeta"]);
  });

  it("sort=minConsumption&order=asc ordena por menor consumo", async () => {
    await seedModels();
    const res = await request(createApp()).get("/api/v1/models?sort=minConsumption&order=asc");
    const names = res.body.data.items.map((m: { name: string }) => m.name);
    expect(names).toEqual(["Alpha", "Charlie", "Zeta"]);
  });

  it("filtra por transmission=MANUAL", async () => {
    await seedModels();
    const res = await request(createApp()).get("/api/v1/models?transmission=MANUAL");
    expect(res.body.data.items).toHaveLength(1);
  });

  // El campo está en km/L (más = mejor). El filtro histórico `consumptionMax`
  // (lte) descartaba justo los autos eficientes cuando el usuario pedía "que
  // gaste poco"; `consumptionMinKmL` (gte) es el que expresa esa intención.
  describe("filtro consumptionMinKmL (rendimiento mínimo, gte)", () => {
    it("incluye solo modelos con alguna versión de al menos ese rendimiento", async () => {
      await seedModels();
      const res = await request(createApp()).get("/api/v1/models?consumptionMinKmL=14");
      expect(res.status).toBe(200);
      const names = res.body.data.items.map((m: { name: string }) => m.name).sort();
      // Alpha rinde 10 km/L: queda fuera. Charlie (14) y Zeta (16) entran.
      expect(names).toEqual(["Charlie", "Zeta"]);
    });

    it("un rendimiento mínimo alto deja la lista vacía", async () => {
      await seedModels();
      const res = await request(createApp()).get("/api/v1/models?consumptionMinKmL=30");
      expect(res.body.data.items).toHaveLength(0);
    });

    it("se combina con consumptionMax formando un rango", async () => {
      await seedModels();
      const res = await request(createApp()).get(
        "/api/v1/models?consumptionMinKmL=12&consumptionMax=15",
      );
      const names = res.body.data.items.map((m: { name: string }) => m.name);
      expect(names).toEqual(["Charlie"]);
    });

    it("consumptionHighwayMinKmL filtra por el rendimiento en carretera", async () => {
      await seedModels();
      const res = await request(createApp()).get("/api/v1/models?consumptionHighwayMinKmL=19");
      const names = res.body.data.items.map((m: { name: string }) => m.name);
      // Carretera: Alpha 14, Charlie 18, Zeta 20.
      expect(names).toEqual(["Zeta"]);
    });
  });

  describe("sort=efficiency (mejor rendimiento del modelo)", () => {
    it("order=desc pone primero el modelo más eficiente", async () => {
      await seedModels();
      const res = await request(createApp()).get("/api/v1/models?sort=efficiency&order=desc");
      const names = res.body.data.items.map((m: { name: string }) => m.name);
      expect(names).toEqual(["Zeta", "Charlie", "Alpha"]);
    });

    it("order=asc pone primero el menos eficiente", async () => {
      await seedModels();
      const res = await request(createApp()).get("/api/v1/models?sort=efficiency&order=asc");
      const names = res.body.data.items.map((m: { name: string }) => m.name);
      expect(names).toEqual(["Alpha", "Charlie", "Zeta"]);
    });

    it("ordena por la MEJOR versión del modelo, no por la peor", async () => {
      const { a } = await seedModels();
      // Alpha rinde 10 km/L, pero le agregamos una versión de 25: pasa a ser el
      // modelo más eficiente de la lista aunque su peor versión siga siendo la
      // peor de todas (eso es lo que mira `minConsumption`).
      await prisma.version.create({
        data: { modelId: a.id, name: "A2-eco", year: 2026, priceClp: 21000000,
          transmission: "CVT", fuel: "HYBRID", engineDisplacementCc: 1500, powerHp: 120,
          torqueNm: 145, consumptionCityKmL: 25, consumptionHighwayKmL: 28,
          lengthMm: 4200, widthMm: 1760, heightMm: 1480, weightKg: 1150, trunkLiters: 360 },
      });
      const res = await request(createApp()).get("/api/v1/models?sort=efficiency&order=desc");
      const names = res.body.data.items.map((m: { name: string }) => m.name);
      expect(names[0]).toBe("Alpha");
    });

    it("los modelos sin dato de consumo van al final en ambas direcciones", async () => {
      await seedModels();
      const b = await prisma.brand.findFirstOrThrow({ where: { name: "T" } });
      const sinDato = await prisma.model.create({
        data: { brandId: b.id, name: "SinDato", segment: "SUV" },
      });
      // Con una versión, pero sin consumo declarado: el modelo existe en la
      // lista y no tiene con qué ordenarse por rendimiento.
      await prisma.version.create({
        data: { modelId: sinDato.id, name: "S1", year: 2026, priceClp: 18000000,
          transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1600,
          powerHp: 120, torqueNm: 150, lengthMm: 4300, widthMm: 1800,
          heightMm: 1600, weightKg: 1400, trunkLiters: 400 },
      });

      const desc = await request(createApp()).get("/api/v1/models?sort=efficiency&order=desc");
      const descNames = desc.body.data.items.map((m: { name: string }) => m.name);
      expect(descNames[descNames.length - 1]).toBe("SinDato");

      const asc = await request(createApp()).get("/api/v1/models?sort=efficiency&order=asc");
      const ascNames = asc.body.data.items.map((m: { name: string }) => m.name);
      expect(ascNames[ascNames.length - 1]).toBe("SinDato");
    });
  });

  it("expone maxConsumption junto a minConsumption", async () => {
    await seedModels();
    const res = await request(createApp()).get("/api/v1/models?sort=name");
    const alpha = res.body.data.items.find((m: { name: string }) => m.name === "Alpha");
    expect(alpha.minConsumption).toBe(10);
    expect(alpha.maxConsumption).toBe(10);
  });

  it("busca por nombre de modelo case-insensitive (q=alp)", async () => {
    await seedModels();
    const res = await request(createApp()).get("/api/v1/models?q=alp");
    const names = res.body.data.items.map((m: { name: string }) => m.name);
    expect(names).toEqual(["Alpha"]);
  });

  it("busca por nombre de marca (q=T)", async () => {
    await seedModels();
    const res = await request(createApp()).get("/api/v1/models?q=T");
    const names = res.body.data.items.map((m: { name: string }) => m.name);
    expect(names).toEqual(["Alpha", "Charlie", "Zeta"]);
  });

  it("q vacío no aplica filtro", async () => {
    await seedModels();
    const res = await request(createApp()).get("/api/v1/models?q=");
    expect(res.body.data.items).toHaveLength(3);
  });
});

describe("GET /api/v1/admin/models", () => {
  it("sin auth → 401", async () => {
    const res = await request(createApp()).get("/api/v1/admin/models");
    expect(res.status).toBe(401);
  });
});
