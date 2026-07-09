const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 10;

const buckets = new Map<string, number[]>();

export const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const list = buckets.get(ip) ?? [];
  const fresh = list.filter((t) => t > cutoff);
  if (fresh.length >= MAX_PER_WINDOW) {
    buckets.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  buckets.set(ip, fresh);
  return false;
};

export const __resetRateLimit = (): void => {
  buckets.clear();
};
