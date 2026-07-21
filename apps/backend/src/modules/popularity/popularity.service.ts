import type { PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";

// Ventana del top en milisegundos. Configurable aqui (no por env) porque la
// decision de producto es fija: "ultimos 30 dias". Si cambia, cambiar este
// valor + invalidar la cache del proceso al redesplegar.
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const TOP_LIMIT = 20;

// Cache en proceso. Para una sola instancia de Node alcanza; en deploys
// multi-instancia la cache se vuelve best-effort (TTL 60s tolera la
// divergencia entre instancias sin notar inconsistencias visibles).
const CACHE_TTL_MS = 60 * 1000;

interface CachedTop {
  ids: string[];
  expiresAt: number;
}

let cache: CachedTop | null = null;

export class PopularityService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Registra un "click en Comparar".
   *
   * - Valida que la version exista y no este soft-deleted.
   * - Dedup: si ya existe un PopularityEvent del mismo (cookieId, modelId,
   *   versionId) en los ultimos `WINDOW_MS`, no hace nada.
   * - Inserta el evento y hace upsert del contador cumulativo.
   * - Invalida la cache del top.
   */
  async recordAdd({ versionId, cookieId }: { versionId: string; cookieId: string }) {
    const version = await this.prisma.version.findFirst({
      where: { id: versionId, deletedAt: null, model: { deletedAt: null } },
      select: { id: true, modelId: true },
    });
    if (!version) throw notFound("Version no encontrada");

    const cutoff = new Date(Date.now() - WINDOW_MS);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.popularityEvent.findFirst({
        where: {
          cookieId,
          versionId,
          modelId: version.modelId,
          createdAt: { gte: cutoff },
        },
        select: { id: true },
      });
      if (existing) return;

      await tx.popularityEvent.create({
        data: { modelId: version.modelId, versionId, cookieId },
      });
      await tx.popularityCounter.upsert({
        where: { modelId: version.modelId },
        create: { modelId: version.modelId, count: 1 },
        update: { count: { increment: 1 } },
      });
    });

    // Invalidar cache para que la proxima consulta recalcule con el nuevo
    // evento (best-effort: si falla, el top se actualizara en <=60s).
    cache = null;
  }

  /**
   * Devuelve los IDs de los modelos mas populares en la ventana. Cache 60s.
   */
  async getTopModelIds(): Promise<string[]> {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.ids;

    const cutoff = new Date(now - WINDOW_MS);
    const rows = await this.prisma.popularityEvent.groupBy({
      by: ["modelId"],
      where: { createdAt: { gte: cutoff } },
      _count: { _all: true },
      orderBy: { _count: { modelId: "desc" } },
      take: TOP_LIMIT,
    });

    const ids = rows.map((r) => r.modelId);
    cache = { ids, expiresAt: now + CACHE_TTL_MS };
    return ids;
  }

  /** Borra eventos fuera de la ventana. Pensado para correr nightly. */
  async prune(): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - WINDOW_MS);
    const res = await this.prisma.popularityEvent.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    cache = null;
    return { deleted: res.count };
  }

  /** Solo para tests: invalida cache y contadores en memoria. */
  static resetCache(): void {
    cache = null;
  }
}
