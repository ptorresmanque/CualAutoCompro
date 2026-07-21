const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const buckets = new Map<string, number[]>();

export const isAuthRateLimited = (key: string): boolean => {
  const cutoff = Date.now() - WINDOW_MS;
  const fresh = (buckets.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
  if (fresh.length >= MAX_ATTEMPTS) {
    buckets.set(key, fresh);
    return true;
  }
  fresh.push(Date.now());
  buckets.set(key, fresh);
  return false;
};

export const resetAuthRateLimit = (): void => buckets.clear();
