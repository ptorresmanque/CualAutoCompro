import type { AppError } from "./errors.js";

export const ok = <T>(data: T) => ({ data, error: null });
export const fail = (err: AppError) => ({
  data: null,
  error: { code: err.code, message: err.message, ...(err.details ?? {}) },
});
