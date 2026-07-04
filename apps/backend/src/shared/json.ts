import type { Prisma } from "@prisma/client";

/**
 * Normaliza el campo `galleryUrls` (tipo `Json` en schema) a `string[]`.
 *
 * MariaDB mapea `Json` a `LONGTEXT` y Prisma puede devolver el valor como
 * string JSON o como array ya parseado según versión. Esta función tolera
 * ambos formatos y filtra elementos no-string.
 */
export function toGalleryUrls(value: Prisma.JsonValue | null | undefined): string[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
      return [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string");
  }

  return [];
}