import type { Category } from "../types/category";
import type { Content } from "../types/content";
import {
  FIXED_CATALOG_CATEGORIES,
  fixedCategoryToCategory,
  slugFromCategoryId,
  slugFromCategoryName,
  type CatalogCategorySlug,
} from "./fixedCategories";

/**
 * Toujours renvoyer les 4 catégories fixes dans l’ordre éditorial,
 * en réutilisant l’id PostgreSQL quand le nom correspond.
 */
export function resolveCatalogCategories(dbCategories: Category[]): Category[] {
  const bySlug = new Map<CatalogCategorySlug, Category>();

  for (const row of dbCategories) {
    const slug = slugFromCategoryName(row.name);
    if (!slug || bySlug.has(slug)) continue;
    const fixed = FIXED_CATALOG_CATEGORIES.find((c) => c.slug === slug);
    if (!fixed) continue;
    bySlug.set(slug, {
      ...fixedCategoryToCategory(fixed, row.created_at),
      id: row.id,
      description: row.description?.trim() || fixed.description,
      position: row.position ?? fixed.position,
    });
  }

  return FIXED_CATALOG_CATEGORIES.map((fixed) => {
    return bySlug.get(fixed.slug) ?? fixedCategoryToCategory(fixed);
  });
}

/** Associe un contenu à une catégorie fixe (id démo ou résolu). */
export function resolveContentCategoryId(
  item: { category_id?: string | null; type: string; tags?: string[] },
  categories: Category[]
): string | null {
  if (item.category_id) {
    const slug = slugFromCategoryId(item.category_id);
    if (slug) {
      const cat = categories.find((c) => slugFromCategoryName(c.name) === slug || c.id === item.category_id);
      return cat?.id ?? item.category_id;
    }
    const byId = categories.find((c) => c.id === item.category_id);
    if (byId) return byId.id;
  }

  const tagKey = (item.tags ?? []).join(" ").toLowerCase();
  if (tagKey.includes("motion") || tagKey.includes("loop") || tagKey.includes("anim")) {
    return categories.find((c) => slugFromCategoryName(c.name) === "animations")?.id ?? null;
  }
  if (item.type === "video" || item.type === "audio") {
    return categories.find((c) => slugFromCategoryName(c.name) === "media")?.id ?? null;
  }
  if (tagKey.includes("data") || tagKey.includes("citation") || tagKey.includes("ambiance")) {
    return categories.find((c) => slugFromCategoryName(c.name) === "elements")?.id ?? null;
  }
  return categories.find((c) => slugFromCategoryName(c.name) === "webcontenus")?.id ?? null;
}

/** Normalise category_id sur chaque contenu pour les filtres / rails. */
export function attachCategoryIds(contents: Content[], categories: Category[]): Content[] {
  return contents.map((item) => {
    const category_id = resolveContentCategoryId(item, categories);
    return category_id && category_id !== item.category_id
      ? { ...item, category_id }
      : item;
  });
}
