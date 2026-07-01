export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "BRAND_HAS_MODELS"
  | "MODEL_HAS_VERSIONS"
  | "CANNOT_DEMOTE_SELF";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  BAD_REQUEST: 400,
  BRAND_HAS_MODELS: 409,
  MODEL_HAS_VERSIONS: 409,
  CANNOT_DEMOTE_SELF: 400,
};

export class AppError extends Error {
  readonly details?: Record<string, unknown> | undefined;
  constructor(
    public readonly code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.details = details;
  }
  get status(): number {
    return STATUS[this.code];
  }
}

export const notFound = (msg = "Recurso no encontrado") =>
  new AppError("NOT_FOUND", msg);
export const unauthorized = (msg = "No autenticado") =>
  new AppError("UNAUTHORIZED", msg);
export const forbidden = (msg = "Sin permisos") =>
  new AppError("FORBIDDEN", msg);
export const conflict = (msg: string, details?: Record<string, unknown>) =>
  new AppError("CONFLICT", msg, details);
export const validation = (msg: string) => new AppError("VALIDATION", msg);
export const badRequest = (msg: string) => new AppError("BAD_REQUEST", msg);
export const cannotDemoteSelf = (msg = "No podés degradarte a vos mismo") =>
  new AppError("CANNOT_DEMOTE_SELF", msg);