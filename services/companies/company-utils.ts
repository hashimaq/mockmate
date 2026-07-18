/** Shared company helpers safe for client + server. */

export function sanitizeCompanyName(raw: string): string {
  return raw
    .replace(/[<>{}[\]\\/`]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
