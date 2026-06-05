import type { Category } from "../types/category";

/** Slugs stables des 4 catégories éditoriales du catalogue. */
export type CatalogCategorySlug = "webcontenus" | "media" | "animations" | "elements";

export type FixedCatalogCategory = {
  slug: CatalogCategorySlug;
  id: string;
  name: string;
  description: string;
  position: number;
  /** Index 0–3 pour les teintes CSS (--catalog-tone-*). */
  tone: number;
};

/** UUIDs déterministes (alignés avec le script seed-catalog). */
export const FIXED_CATEGORY_IDS: Record<CatalogCategorySlug, string> = {
  webcontenus: "a0000001-0001-4001-8001-000000000001",
  media: "a0000001-0001-4001-8001-000000000002",
  animations: "a0000001-0001-4001-8001-000000000003",
  elements: "a0000001-0001-4001-8001-000000000004",
};

export const FIXED_CATALOG_CATEGORIES: readonly FixedCatalogCategory[] = [
  {
    slug: "webcontenus",
    id: FIXED_CATEGORY_IDS.webcontenus,
    name: "Webcontenus",
    description: "Articles, dossiers et formats pensés pour le web.",
    position: 1,
    tone: 0,
  },
  {
    slug: "media",
    id: FIXED_CATEGORY_IDS.media,
    name: "Média",
    description: "Vidéos, audio et formats broadcast au catalogue.",
    position: 2,
    tone: 1,
  },
  {
    slug: "animations",
    id: FIXED_CATEGORY_IDS.animations,
    name: "Animations",
    description: "Motion, séquences animées et formats courts dynamiques.",
    position: 3,
    tone: 2,
  },
  {
    slug: "elements",
    id: FIXED_CATEGORY_IDS.elements,
    name: "Éléments",
    description: "Modules, vignettes et fragments éditoriaux.",
    position: 4,
    tone: 3,
  },
] as const;

const SLUG_ALIASES: Record<string, CatalogCategorySlug> = {
  webcontenus: "webcontenus",
  webcontenu: "webcontenus",
  web: "webcontenus",
  media: "media",
  medias: "media",
  média: "media",
  animation: "animations",
  animations: "animations",
  element: "elements",
  elements: "elements",
  éléments: "elements",
  elementseditoriaux: "elements",
};

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Déduit le slug à partir du nom de catégorie en base. */
export function slugFromCategoryName(name: string): CatalogCategorySlug | null {
  const key = normalizeKey(name.trim());
  return SLUG_ALIASES[key] ?? null;
}

export function slugFromCategoryId(id: string): CatalogCategorySlug | null {
  for (const cat of FIXED_CATALOG_CATEGORIES) {
    if (cat.id === id) return cat.slug;
  }
  return null;
}

export function fixedCategoryToCategory(
  fixed: FixedCatalogCategory,
  createdAt = "2026-01-01T00:00:00.000Z"
): Category {
  return {
    id: fixed.id,
    name: fixed.name,
    description: fixed.description,
    position: fixed.position,
    created_at: createdAt,
  };
}

export function getFixedCatalogCategories(): Category[] {
  return FIXED_CATALOG_CATEGORIES.map((c) => fixedCategoryToCategory(c));
}
