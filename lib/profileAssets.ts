/** Portrait Thomas — accueil, header, à propos, miniature OG. */
export const PROFILE_PORTRAIT_SRC = "/src/joueurs/apropos.jpg?v=2";

/** Anciennes URLs de démo (stade / joueurs) encore présentes en base VPS. */
const LEGACY_PORTRAIT_RE = /^\/src\/(?:stade\/im\d+\.jpg|joueurs\/joueur\d+\.webp)(?:\?.*)?$/i;

/** Portrait éditorial : vide ou URL héritée → `apropos.jpg`. */
export function pickPortraitUrl(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || LEGACY_PORTRAIT_RE.test(trimmed)) return PROFILE_PORTRAIT_SRC;
  return trimmed;
}
