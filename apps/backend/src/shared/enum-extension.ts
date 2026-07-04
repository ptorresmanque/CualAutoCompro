import type { PrismaClient } from "@prisma/client";

export type EnumName = "Segment" | "Fuel" | "Transmission";

const ENUM_VALUE_REGEX = /^[A-Z0-9_]+$/;

/**
 * En MariaDB, Prisma mapea enums a `VARCHAR` sin `CHECK` constraint,
 * por lo que no hay nada que extender a nivel de DB. La validación
 * contra enums vive solo en el cliente Prisma generado y se evade
 * en los services usando raw SQL. Esta función queda como no-op para
 * preservar la API pública.
 *
 * Solo conservamos la validación de regex como guard contra SQL injection
 * si en el futuro alguien cambia la implementación.
 */
export async function extendEnum(
  _prisma: PrismaClient,
  enumName: EnumName,
  newValue: string,
): Promise<void> {
  if (!ENUM_VALUE_REGEX.test(newValue)) {
    throw new Error(`Valor inválido para enum ${enumName}: ${newValue}`);
  }
  // No-op en MariaDB.
}
