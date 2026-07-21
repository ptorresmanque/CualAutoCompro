// Rate-limit por IP para /popular/events. Patron heredado de auth-rate-limit
// (sin dependencias externas). Sliding window en memoria.

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 60; // ~1 click/seg sostenido durante 1 min, suficiente para UX real
const buckets = new Map<string, number[]>();

export const isPopularityRateLimited = (key: string): boolean => {
  const cutoff = Date.now() - WINDOW_MS;
  const fresh = (buckets.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
  if (fresh.length >= MAX_PER_WINDOW) {
    buckets.set(key, fresh);
    return true;
  }
  fresh.push(Date.now());
  buckets.set(key, fresh);
  return false;
};

export const resetPopularityRateLimit = (): void => buckets.clear();
