import type { PrismaClient } from "@prisma/client";

export type EnumName = "Segment" | "Fuel" | "Transmission";

const ENUM_VALUE_REGEX = /^[A-Z0-9_]+$/;

export async function extendEnum(
  prisma: PrismaClient,
  enumName: EnumName,
  newValue: string,
): Promise<void> {
  if (!ENUM_VALUE_REGEX.test(newValue)) {
    throw new Error(`Valor inválido para enum ${enumName}: ${newValue}`);
  }
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${newValue}'`,
  );
  // Postgres cachea definiciones de enum por sesión. Forzamos reconnect.
  await prisma.$disconnect();
  await prisma.$connect();
}
