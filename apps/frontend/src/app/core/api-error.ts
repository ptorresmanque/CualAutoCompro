import { HttpErrorResponse } from "@angular/common/http";

export interface BackendError {
  code: string;
  message: string;
  fields?: Array<{ path: (string | number)[]; message: string }>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: BackendError | null;
}

export class ApiCallError extends Error {
  constructor(
    public readonly backend: BackendError,
    public readonly status: number,
  ) {
    super(backend.message);
    this.name = "ApiCallError";
  }
}

/**
 * Normaliza lo que sea que haya lanzado `HttpClient` a un `ApiCallError`.
 *
 * `ApiService.get/post/patch/put/delete` no desenvuelven la respuesta, así que
 * ante un 4xx el que llega es un `HttpErrorResponse` cuyo `.error` trae el
 * sobre del backend (`{ data: null, error: { code, message, fields } }`).
 * Sin esta conversión, `err instanceof ApiCallError` nunca es true y los
 * errores por campo del backend no se pueden pintar en el formulario.
 *
 * Devuelve `null` cuando el error no trae ese sobre (caída de red, 5xx sin
 * cuerpo, o un Error cualquiera): en ese caso el llamador debe mostrar el
 * mensaje genérico.
 */
export function toApiCallError(err: unknown): ApiCallError | null {
  if (err instanceof ApiCallError) return err;
  if (!(err instanceof HttpErrorResponse)) return null;

  const body = err.error as { error?: unknown } | null;
  if (!body || typeof body !== "object") return null;

  const backend = body.error;
  if (!backend || typeof backend !== "object") return null;

  const { code, message } = backend as Partial<BackendError>;
  if (typeof code !== "string" || typeof message !== "string") return null;

  return new ApiCallError(backend as BackendError, err.status);
}

/**
 * Extracts `data` from an `ApiResponse<T>` and throws `ApiCallError` if
 * the response has `error !== null`. Use this to opt-in to typed error
 * handling without changing the rest of the call site.
 */
export function unwrap<T>(body: ApiResponse<T>, status = 200): T {
  if (body.error) {
    throw new ApiCallError(body.error, status);
  }
  if (body.data === null) {
    throw new ApiCallError(
      { code: "EMPTY_RESPONSE", message: "Respuesta vacía del servidor" },
      status,
    );
  }
  return body.data;
}