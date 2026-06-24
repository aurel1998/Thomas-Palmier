import type { Content } from "../types/content";

/** Catalogue démo désactivé — le site affiche uniquement les contenus en base. */
export const DEMO_CATALOG: Content[] = [];

/** Contenu phare pour l'accueil (liste réelle uniquement). */
export function pickFeaturedStory(contents: Content[]): Content | null {
  const sorted = [...contents].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted.find((c) => c.is_featured) ?? sorted[0] ?? null;
}

export function getDemoCatalog(): Content[] {
  return [];
}

/** Ne plus injecter de contenus fictifs. */
export function withDemoCatalogFallback(
  apiContents: Content[],
  _opts?: { subcategoryId?: string | null; siteUsesDemo?: boolean }
): Content[] {
  return apiContents;
}
