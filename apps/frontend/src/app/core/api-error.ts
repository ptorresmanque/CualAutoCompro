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