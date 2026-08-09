/**
 * Sliding window en memoria, sin dependencias.
 *
 * Devuelve la función de chequeo: `true` = límite alcanzado, y en ese caso el
 * intento NO se cuenta (si no, un cliente insistente se auto-extiende la
 * ventana para siempre). `.reset()` es para los tests.
 *
 * ponytail: los buckets viven en el proceso. Con más de una instancia del
 * backend cada una lleva su propia cuenta; si eso pasa, mover a Redis o a la
 * DB. Hoy corre en un solo proceso sobre cPanel.
 */
export const rateLimiter = (windowMs: number, max: number) => {
  const buckets = new Map<string, number[]>();

  const check = (key: string): boolean => {
    const now = Date.now();
    const fresh = (buckets.get(key) ?? []).filter((timestamp) => timestamp > now - windowMs);
    if (fresh.length >= max) {
      buckets.set(key, fresh);
      return true;
    }
    fresh.push(now);
    buckets.set(key, fresh);
    return false;
  };

  check.reset = (): void => buckets.clear();
  return check;
};
