import type { Category } from "../types/category";

/** Slugs stables des 4 grandes catégories éditoriales. */
export type CatalogCategorySlug = "radio" | "tv" | "presse" | "reseaux";

export type FixedCatalogCategory = {
  slug: CatalogCategorySlug;
  id: string;
  name: string;
  description: string;
  position: number;
  /** Index 0–3 pour les teintes CSS (--catalog-tone-*). */
  tone: number;
  /** Sigle décoratif sur la carte catégorie. */
  mark: string;
};

/** UUIDs déterministes (alignés avec le script seed-catalog). */
export const FIXED_CATEGORY_IDS: Record<CatalogCategorySlug, string> = {
  radio: "a0000001-0001-4001-8001-000000000001",
  tv: "a0000001-0001-4001-8001-000000000002",
  presse: "a0000001-0001-4001-8001-000000000003",
  reseaux: "a0000001-0001-4001-8001-000000000004",
};

export const FIXED_CATALOG_CATEGORIES: readonly FixedCatalogCategory[] = [
  {
    slug: "radio",
    id: FIXED_CATEGORY_IDS.radio,
    name: "Radio",
    description: "Chroniques, interviews et magazines — explorez par rubrique.",
    position: 1,
    tone: 0,
    mark: "ON AIR",
  },
  {
    slug: "tv",
    id: FIXED_CATEGORY_IDS.tv,
    name: "TV",
    description: "Reportages, directs et formats télévisuels — classés par rubrique.",
    position: 2,
    tone: 1,
    mark: "TV",
  },
  {
    slug: "presse",
    id: FIXED_CATEGORY_IDS.presse,
    name: "Presse écrite/web",
    description: "Articles, enquêtes et publications numériques — par rubrique.",
    position: 3,
    tone: 2,
    mark: "PRESSE",
  },
  {
    slug: "reseaux",
    id: FIXED_CATEGORY_IDS.reseaux,
    name: "Réseaux sociaux",
    description: "Reels, stories et formats courts — organisés par rubrique.",
    position: 4,
    tone: 3,
    mark: "SOCIAL",
  },
] as const;

const SLUG_ALIASES: Record<string, CatalogCategorySlug> = {
  radio: "radio",
  tv: "tv",
  television: "tv",
  presse: "presse",
  presseecrite: "presse",
  presseecriteweb: "presse",
  presseweb: "presse",
  reseaux: "reseaux",
  reseauxsociaux: "reseaux",
  social: "reseaux",
  socialmedia: "reseaux",
  // Anciens noms (migration douce)
  webcontenus: "presse",
  webcontenu: "presse",
  web: "presse",
  media: "tv",
  medias: "tv",
  média: "tv",
  animation: "reseaux",
  animations: "reseaux",
  element: "reseaux",
  elements: "reseaux",
  éléments: "reseaux",
  elementseditoriaux: "reseaux",
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

export function toneForCatalogSlug(slug: CatalogCategorySlug | null): number {
  if (!slug) return 0;
  const found = FIXED_CATALOG_CATEGORIES.find((c) => c.slug === slug);
  return found?.tone ?? 0;
}

export function markForCatalogSlug(slug: CatalogCategorySlug | null): string {
  if (!slug) return "";
  const found = FIXED_CATALOG_CATEGORIES.find((c) => c.slug === slug);
  return found?.mark ?? "";
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
