import type { Subcategory } from "../types/subcategory";

/** Rubriques démo désactivées — uniquement la base PostgreSQL. */
export function getDemoSubcategories(): Subcategory[] {
  return [];
}

export function withDemoSubcategoriesFallback(apiSubcategories: Subcategory[]): Subcategory[] {
  return apiSubcategories;
}
