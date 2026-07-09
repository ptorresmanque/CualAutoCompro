// Seed inicial del catálogo cualautocompro.
//
// Población en orden topológico:
//   1. Brand   (upsert por name)
//   2. Model   (upsert por brandId+name) — resuelve brandId vía brandName
//   3. Version (create)                   — resuelve modelId vía brandName+modelName
//   4. EquipmentItem (upsert por name)   — preserva category si la fila existe
//   5. VersionEquipment (create)          — joins (versionId, equipmentItemId)
//   6. MaintenanceCost (createMany)       — 4 puntos por versión
//
// Idempotencia: las primeras 4 son upserts. Versions / joins / maintenance son
// `create` directos — un re-run falla en el primer PK duplicado. Para reset
// completo usar `npm run db:reset` (definido en package.json).

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { z } from "zod";
import { catalog, generateMaintenanceCosts } from "./catalog.js";

// Carga el .env del directorio actual o del padre. En el server, esto es
// apps/backend/.env (mismo directorio que este script tras la extraccion
// del bundle FTP).
config({ path: ".env" });
config({ path: "../.env" });

// Validacion inline solo de las variables que necesita el seed.
// Importar desde src/config/env.js rompe en runtime con ESM + tsx
// (Node no resuelve el .js -> .ts cuando se ejecuta via 'npx tsx').
const seedEnv = z
  .object({
    ADMIN_EMAIL: z.string().email().default("admin@cualautocompro.cl"),
    ADMIN_INITIAL_PASSWORD: z.string().min(8).default("admin1234"),
    DATABASE_URL: z.string().url(),
  })
  .parse(process.env);

if (
  process.env.NODE_ENV === "production" &&
  seedEnv.ADMIN_INITIAL_PASSWORD === "admin1234"
) {
  throw new Error("ADMIN_INITIAL_PASSWORD debe ser sobreescrito en produccion");
}

const prisma = new PrismaClient();

async function main() {
  const t0 = Date.now();
  console.log("[seed] iniciando…");

  const adminEmail = seedEnv.ADMIN_EMAIL;
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(seedEnv.ADMIN_INITIAL_PASSWORD, 10);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, name: "Admin", role: "ADMIN" },
    });
    console.log(`[seed] admin creado: ${adminEmail}`);
  } else if (existingAdmin.role !== "ADMIN") {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { role: "ADMIN" },
    });
    console.log(`[seed] admin promovido: ${adminEmail}`);
  }

  const brandIdByName = new Map<string, string>();
  for (const b of catalog.brands) {
    const row = await prisma.brand.upsert({
      where: { name: b.name },
      update: { logoUrl: b.logoUrl },
      create: b,
    });
    brandIdByName.set(b.name, row.id);
  }
  console.log(`[seed] brands:        ${brandIdByName.size}`);

  const modelIdByKey = new Map<string, string>();
  for (const m of catalog.models) {
    const brandId = brandIdByName.get(m.brandName);
    if (!brandId) throw new Error(`[seed] brand no encontrada: ${m.brandName}`);
    const row = await prisma.model.upsert({
      where: { brandId_name: { brandId, name: m.name } },
      update: { segment: m.segment, imageUrl: m.imageUrl, galleryUrls: m.galleryUrls },
      create: { brandId, name: m.name, segment: m.segment, imageUrl: m.imageUrl, galleryUrls: m.galleryUrls },
    });
    modelIdByKey.set(`${m.brandName}|${m.name}`, row.id);
  }
  console.log(`[seed] models:        ${modelIdByKey.size}`);

  const versionIdByKey = new Map<string, string>();
  for (const v of catalog.versions) {
    const modelId = modelIdByKey.get(`${v.brandName}|${v.modelName}`);
    if (!modelId) throw new Error(`[seed] model no encontrado: ${v.brandName} ${v.modelName}`);
    const { brandName: _bn, modelName: _mn, ...versionData } = v;
    const row = await prisma.version.create({
      data: { ...versionData, modelId },
    });
    versionIdByKey.set(`${v.brandName}|${v.modelName}|${v.name}`, row.id);
  }
  console.log(`[seed] versions:      ${versionIdByKey.size}`);

  const equipmentIdByName = new Map<string, string>();
  for (const e of catalog.equipmentItems) {
    const row = await prisma.equipmentItem.upsert({
      where: { name: e.name },
      update: { category: e.category },
      create: e,
    });
    equipmentIdByName.set(e.name, row.id);
  }
  console.log(`[seed] equipmentItems:${equipmentIdByName.size}`);

  let vE_count = 0;
  for (const ve of catalog.versionEquipment) {
    const versionId = versionIdByKey.get(`${ve.brandName}|${ve.modelName}|${ve.versionName}`);
    if (!versionId)
      throw new Error(
        `[seed] version no encontrada en versionEquipment: ${ve.brandName} ${ve.modelName} ${ve.versionName}`,
      );
    const equipmentItemId = equipmentIdByName.get(ve.equipmentName);
    if (!equipmentItemId)
      throw new Error(`[seed] equipmentItem no encontrado: ${ve.equipmentName}`);
    await prisma.versionEquipment.create({ data: { versionId, equipmentItemId } });
    vE_count++;
  }
  console.log(`[seed] versionEquip:  ${vE_count}`);

  const maintenanceData = catalog.versions.flatMap((v) => {
    const versionId = versionIdByKey.get(`${v.brandName}|${v.modelName}|${v.name}`);
    if (!versionId)
      throw new Error(
        `[seed] version no encontrada en maintenance: ${v.brandName} ${v.modelName} ${v.name}`,
      );
    return generateMaintenanceCosts(v).map((mc) => ({
      versionId,
      mileageTag: mc.mileageTag,
      costClp: mc.costClp,
    }));
  });
  const mcResult = await prisma.maintenanceCost.createMany({ data: maintenanceData });
  console.log(`[seed] maintenance:   ${mcResult.count}`);

  // Precios de combustible iniciales (BENCINA, DIESEL, ELECTRIC). Skip si ya
  // existe al menos un precio por fuelType (idempotencia — los precios reales
  // los gestiona el admin via /admin/fuel-prices).
const initialFuelPrices = [
    { fuelType: "BENCINA", pricePerUnitClp: 1200, unit: "L" },
    { fuelType: "DIESEL", pricePerUnitClp: 1050, unit: "L" },
    { effectiveFrom: new Date(Date.now() - 86400000), fuelType: "ELECTRIC", pricePerUnitClp: 200, unit: "kWh" },
  ];
  let fpCount = 0;
  for (const fp of initialFuelPrices) {
    const existing = await prisma.fuelPrice.findFirst({
      where: { fuelType: fp.fuelType, deletedAt: null },
    });
    if (existing) continue;
    await prisma.fuelPrice.create({ data: fp });
    fpCount++;
  }
  console.log(`[seed] fuelPrices:    ${fpCount}`);

  const elapsed = Date.now() - t0;
  console.log(`[seed] completado en ${elapsed}ms`);
}

main()
  .catch((e) => {
    console.error("[seed] ERROR:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });