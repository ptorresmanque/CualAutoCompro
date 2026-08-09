import { rateLimiter } from "../../shared/rate-limit.js";

export const isRateLimited = rateLimiter(60 * 1000, 10);
