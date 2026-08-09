/**
 * URL-safe slug from arbitrary text: lowercases, strips diacritics, replaces
 * any non [a-z0-9] with '-', collapses repeats, and trims leading/trailing
 * dashes. Result is safe to embed in a path segment.
 */
export const slugify = (input: string): string => {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining marks (acentos)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

