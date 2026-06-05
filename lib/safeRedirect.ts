/** Autorise uniquement les redirections internes (anti open-redirect). */
export function sanitizeInternalRedirect(raw: string | null | undefined, fallback = "/monsite"): string {
  if (!raw?.trim()) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("://") || value.includes("\\")) return fallback;
  return value;
}
