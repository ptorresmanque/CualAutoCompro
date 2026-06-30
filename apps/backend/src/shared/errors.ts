export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "BAD_REQUEST";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  CONFLICT: 409,
  BAD_REQUEST: 400,
};

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
  get status(): number {
    return STATUS[this.code];
  }
}

export const notFound = (msg = "Recurso no encontrado") =>
  new AppError("NOT_FOUND", msg);
export const unauthorized = (msg = "No autenticado") =>
  new AppError("UNAUTHORIZED", msg);
export const conflict = (msg: string) => new AppError("CONFLICT", msg);
export const validation = (msg: string) => new AppError("VALIDATION", msg);
export const badRequest = (msg: string) => new AppError("BAD_REQUEST", msg);
