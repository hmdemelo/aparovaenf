/**
 * Convert a human label into a URL-safe slug: strip accents, lowercase, and
 * collapse non-alphanumeric runs into single hyphens. Used for catalog records
 * (e.g. subjects) where the admin may omit an explicit slug.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
