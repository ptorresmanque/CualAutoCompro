import { rateLimiter } from "../../shared/rate-limit.js";

// ~1 click/seg sostenido durante 1 min, suficiente para UX real.
export const isPopularityRateLimited = rateLimiter(60 * 1000, 60);
