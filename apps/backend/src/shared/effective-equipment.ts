import type { PrismaClient } from "@prisma/client";

// ----------------------------------------------------------------------------
// Resolución del equipamiento efectivo de una versión.
//
//   efectivo(versión) = (propio ∪ modelo ∪ marca) − exclusiones(versión)
//
// El equipamiento de serie de una marca o de un modelo NO se materializa en
// `VersionEquipment`: se resuelve en cada lectura. Eso hace que una versión
// nueva herede sin ningún paso extra, que desasociar un ítem de la marca lo
// quite al instante de todas sus versiones, y que no existan copias que puedan
// divergir del origen.
//
// El precio es que todo endpoint que devuelva `equipmentItems` tiene que pasar
// por acá en vez de por un `include` de Prisma. Vive en `shared/` (y no en el
// módulo `equipment`) porque lo consumen `versions`, `models` y `compare`, y
// los módulos no se importan entre sí — ver AGENTS.md de backend §1.
// ----------------------------------------------------------------------------

export interface VersionEquipmentRef {
  versionId: string;
  modelId: string;
  brandId: string;
}

export type EquipmentSource = "VERSION" | "MODEL" | "BRAND";

export interface EquipmentItemLite {
  id: string;
  name: string;
  category: string;
}

export interface EffectiveEquipmentEntry {
  equipmentItem: EquipmentItemLite;
  source: EquipmentSource;
  /** Nombre de la marca o del modelo del que se hereda; `null` si es propio. */
  sourceName: string | null;
}

/** Precedencia al deduplicar: lo propio pisa lo del modelo, que pisa lo de la marca. */
const SOURCE_RANK: Record<EquipmentSource, number> = { VERSION: 0, MODEL: 1, BRAND: 2 };

const ITEM_SELECT = { select: { id: true, name: true, category: true } } as const;

/**
 * Devuelve, por `versionId`, el equipamiento efectivo ya ordenado por categoría
 * y nombre. Las versiones sin equipamiento no aparecen en el Map: el caller debe
 * usar `map.get(id) ?? []`.
 *
 * Resuelve todas las versiones de una sola pasada (4 queries en total, sin
 * importar cuántas versiones se pidan) para no caer en N+1 desde los listados.
 */
export async function resolveEffectiveEquipment(
  prisma: PrismaClient,
  refs: VersionEquipmentRef[],
): Promise<Map<string, EffectiveEquipmentEntry[]>> {
  const result = new Map<string, EffectiveEquipmentEntry[]>();
  if (refs.length === 0) return result;

  const versionIds = [...new Set(refs.map((r) => r.versionId))];
  const modelIds = [...new Set(refs.map((r) => r.modelId))];
  const brandIds = [...new Set(refs.map((r) => r.brandId))];

  const [own, byModel, byBrand, exclusions] = await Promise.all([
    prisma.versionEquipment.findMany({
      where: { versionId: { in: versionIds }, equipmentItem: { deletedAt: null } },
      select: { versionId: true, equipmentItem: ITEM_SELECT },
    }),
    prisma.modelEquipment.findMany({
      where: { modelId: { in: modelIds }, equipmentItem: { deletedAt: null } },
      select: {
        modelId: true,
        equipmentItem: ITEM_SELECT,
        model: { select: { name: true } },
      },
    }),
    prisma.brandEquipment.findMany({
      where: { brandId: { in: brandIds }, equipmentItem: { deletedAt: null } },
      select: {
        brandId: true,
        equipmentItem: ITEM_SELECT,
        brand: { select: { name: true } },
      },
    }),
    prisma.versionEquipmentExclusion.findMany({
      where: { versionId: { in: versionIds } },
      select: { versionId: true, equipmentItemId: true },
    }),
  ]);

  const ownByVersion = groupBy(own, (r) => r.versionId);
  const modelByModel = groupBy(byModel, (r) => r.modelId);
  const brandByBrand = groupBy(byBrand, (r) => r.brandId);
  const excludedByVersion = new Map<string, Set<string>>();
  for (const e of exclusions) {
    let set = excludedByVersion.get(e.versionId);
    if (!set) {
      set = new Set();
      excludedByVersion.set(e.versionId, set);
    }
    set.add(e.equipmentItemId);
  }

  for (const ref of refs) {
    if (result.has(ref.versionId)) continue;
    const excluded = excludedByVersion.get(ref.versionId) ?? new Set<string>();
    const merged = new Map<string, EffectiveEquipmentEntry>();

    const add = (entry: EffectiveEquipmentEntry): void => {
      if (excluded.has(entry.equipmentItem.id)) return;
      const previous = merged.get(entry.equipmentItem.id);
      if (previous && SOURCE_RANK[previous.source] <= SOURCE_RANK[entry.source]) return;
      merged.set(entry.equipmentItem.id, entry);
    };

    for (const r of ownByVersion.get(ref.versionId) ?? []) {
      add({ equipmentItem: r.equipmentItem, source: "VERSION", sourceName: null });
    }
    for (const r of modelByModel.get(ref.modelId) ?? []) {
      add({ equipmentItem: r.equipmentItem, source: "MODEL", sourceName: r.model.name });
    }
    for (const r of brandByBrand.get(ref.brandId) ?? []) {
      add({ equipmentItem: r.equipmentItem, source: "BRAND", sourceName: r.brand.name });
    }

    result.set(ref.versionId, [...merged.values()].sort(byCategoryThenName));
  }

  return result;
}

/**
 * Ids del equipamiento que una versión de ese modelo/marca hereda. Lo usa
 * `EquipmentService.syncVersion` para separar la selección efectiva que manda
 * el admin en equipamiento propio y exclusiones.
 */
export async function inheritedEquipmentIds(
  prisma: PrismaClient,
  modelId: string,
  brandId: string,
): Promise<Set<string>> {
  const [byModel, byBrand] = await Promise.all([
    prisma.modelEquipment.findMany({
      where: { modelId, equipmentItem: { deletedAt: null } },
      select: { equipmentItemId: true },
    }),
    prisma.brandEquipment.findMany({
      where: { brandId, equipmentItem: { deletedAt: null } },
      select: { equipmentItemId: true },
    }),
  ]);
  return new Set([...byModel, ...byBrand].map((r) => r.equipmentItemId));
}

function byCategoryThenName(a: EffectiveEquipmentEntry, b: EffectiveEquipmentEntry): number {
  const byCategory = a.equipmentItem.category.localeCompare(b.equipmentItem.category);
  return byCategory !== 0 ? byCategory : a.equipmentItem.name.localeCompare(b.equipmentItem.name);
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const bucket = out.get(k);
    if (bucket) bucket.push(row);
    else out.set(k, [row]);
  }
  return out;
}
