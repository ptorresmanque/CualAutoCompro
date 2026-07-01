import type { AppError } from "./errors.js";

export const ok = <T>(data: T) => ({ data, error: null });
export const fail = (err: AppError) => {
  const { code: _omitCode, message: _omitMsg, ...rest } = err.details ?? {};
  return {
    data: null,
    error: { code: err.code, message: err.message, ...rest },
  };
};
