import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const globalForPrisma = globalThis as unknown as { __testPrisma?: PrismaClient };

export const setupTestPrisma = (): PrismaClient => {
  if (!globalForPrisma.__testPrisma) {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
      stdio: "ignore",
    });
    globalForPrisma.__testPrisma = new PrismaClient();
  }
  return globalForPrisma.__testPrisma;
};

export const resetTestDb = async (prisma: PrismaClient) => {
  await prisma.$transaction([
    prisma.comparisonItem.deleteMany(),
    prisma.comparison.deleteMany(),
    prisma.maintenanceCost.deleteMany(),
    prisma.versionEquipment.deleteMany(),
    prisma.equipmentItem.deleteMany(),
    prisma.version.deleteMany(),
    prisma.model.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};