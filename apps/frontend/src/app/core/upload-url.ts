import { ENV } from './env';

/**
 * Resolves a URL returned by the API into a URL the browser can fetch
 * in the current page context.
 *
 * The upload endpoint (`POST /api/v1/admin/uploads`) returns relative
 * paths like `/uploads/2026-07/abc.png`. In dev the frontend runs on
 * `:4200` and the backend on `:3000`, so a relative URL would resolve
 * against the frontend origin (`http://localhost:4200/uploads/...`) and
 * 404. In production the frontend and backend are typically on the same
 * origin, so the relative URL works directly.
 *
 * This helper centralises the resolution:
 * - Already-absolute URLs (`http://`, `https://`, `data:`, `blob:`, ...)
 *   are returned unchanged.
 * - Relative `/uploads/...` paths are prefixed with the backend origin
 *   (apiBase with `/api/v1` stripped).
 *
 * The function is pure (no side effects) and safe to call from templates,
 * computeds, and event handlers.
 */
export function toAbsoluteUploadUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Any URL with a protocol is already absolute (http, https, data, blob, file, etc.)
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  const origin = ENV.apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url}`;
}
