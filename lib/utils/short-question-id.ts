/**
 * Derives the short, human-readable question identifier shown across author,
 * admin, and student surfaces: the first 8 characters of the question UUID,
 * without hyphens, uppercased (e.g. `d9f825b7-...` -> `D9F825B7`).
 *
 * The full UUID stays the source of truth for routes, APIs, and the database;
 * this value is display-only so prints and reports can be traced back.
 */
export function shortQuestionId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 8).toUpperCase()
}
