import { rateLimiter } from "../../shared/rate-limit.js";

const check = rateLimiter(15 * 60 * 1000, 10);

export const isAuthRateLimited = check;
export const resetAuthRateLimit = check.reset;
