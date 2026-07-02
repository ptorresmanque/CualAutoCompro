import { z } from "zod";

/**
 * Zod helper for image URL fields.
 *
 * Accepts:
 *   - absolute URLs (http://..., https://...)
 *   - relative URLs that point to the backend's /uploads/* path
 *     (returned by POST /api/v1/admin/uploads — see uploads module)
 *
 * The default `z.string().url()` only accepts absolute URLs, which breaks
 * the create/update flow after the user uploads an image: the upload
 * endpoint returns a relative URL like "/uploads/2026-07/abc.png" and
 * the model's imageUrl DTO rejects it.
 */
export const imageUrl = z
  .string()
  .min(1)
  .refine(
    (v) => {
      if (v.startsWith("/uploads/")) return true;
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    },
    { message: "URL inválida (debe ser absoluta o ruta /uploads/...)" },
  );

export const imageUrlArray = z.array(imageUrl);
