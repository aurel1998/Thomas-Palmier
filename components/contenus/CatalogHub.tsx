"use client";

import type { ReactNode } from "react";
import type { Category } from "../../types/category";
import type { Content } from "../../types/content";
import type { Subcategory } from "../../types/subcategory";
import { summarizeContentMix } from "../../lib/catalogContentCopy";
import { catalogHubIntro, categoryCatalogLede, categoryChipLabel } from "../../lib/categoryCopy";
import {
  markForCatalogSlug,
  slugFromCategoryName,
  toneForCatalogSlug,
  type CatalogCategorySlug,
} from "../../lib/fixedCategories";

export type CatalogLevel = "categories" | "subcategories" | "contents";

type CatalogHubProps = {
  level: CatalogLevel;
  categories: Category[];
  subcategories: Subcategory[];
  items: Content[];
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  selectedCategory: Category | null;
  selectedSubcategory: Subcategory | null;
  isLoading: boolean;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory: (subcategoryId: string) => void;
  onBackToCategories: () => void;
  onBackToSubcategories: () => void;
  children?: ReactNode;
};

function slugForCategory(category: Category): CatalogCategorySlug {
  return slugFromCategoryName(category.name) ?? "radio";
}

export function CatalogHub({
  level,
  categories,
  subcategories,
  items,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedCategory,
  selectedSubcategory,
  isLoading,
  onSelectCategory,
  onSelectSubcategory,
  onBackToCategories,
  onBackToSubcategories,
  children,
}: CatalogHubProps) {
  const subcategoriesByCategory = new Map<string, Subcategory[]>();
  for (const sub of subcategories) {
    const list = subcategoriesByCategory.get(sub.category_id) ?? [];
    list.push(sub);
    subcategoriesByCategory.set(sub.category_id, list);
  }

  const itemsByCategory = new Map<string, Content[]>();
  const itemsBySubcategory = new Map<string, Content[]>();
  for (const item of items) {
    if (item.subcategory_id) {
      const subList = itemsBySubcategory.get(item.subcategory_id) ?? [];
      subList.push(item);
      itemsBySubcategory.set(item.subcategory_id, subList);
      const sub = subcategories.find((s) => s.id === item.subcategory_id);
      if (sub) {
        const catList = itemsByCategory.get(sub.category_id) ?? [];
        catList.push(item);
        itemsByCategory.set(sub.category_id, catList);
      }
    } else if (item.category_id) {
      const catList = itemsByCategory.get(item.category_id) ?? [];
      catList.push(item);
      itemsByCategory.set(item.category_id, catList);
    }
  }

  const pageTitle =
    level === "contents" && selectedSubcategory
      ? selectedSubcategory.name
      : level === "subcategories" && selectedCategory
        ? categoryChipLabel(selectedCategory)
        : "Contenus";

  const pageLede =
    level === "contents" && selectedSubcategory
      ? selectedSubcategory.description?.trim() ||
        summarizeContentMix(itemsBySubcategory.get(selectedSubcategory.id) ?? [])
      : level === "subcategories" && selectedCategory
        ? categoryCatalogLede(
            selectedCategory,
            (itemsByCategory.get(selectedCategory.id) ?? []).length
          )
        : catalogHubIntro();

  return (
    <>
      <header className="mes-contenus-head mes-canal__top">
        <div className="mes-canal__headCopy">
          {level !== "categories" ? (
            <nav className="catalog-crumb" aria-label="Fil d'Ariane">
              <button type="button" className="catalog-crumb__link" onClick={onBackToCategories}>
                Contenus
              </button>
              {selectedCategory ? (
                <>
                  <span className="catalog-crumb__sep" aria-hidden="true">
                    /
                  </span>
                  {level === "subcategories" ? (
                    <span className="catalog-crumb__current">{categoryChipLabel(selectedCategory)}</span>
                  ) : (
                    <button
                      type="button"
                      className="catalog-crumb__link"
                      onClick={onBackToSubcategories}
                    >
                      {categoryChipLabel(selectedCategory)}
                    </button>
                  )}
                </>
              ) : null}
              {level === "contents" && selectedSubcategory ? (
                <>
                  <span className="catalog-crumb__sep" aria-hidden="true">
                    /
                  </span>
                  <span className="catalog-crumb__current">{selectedSubcategory.name}</span>
                </>
              ) : null}
            </nav>
          ) : null}
          <h1 className="mes-canal__title">{pageTitle}</h1>
          <p className="mes-canal__lede">{pageLede}</p>
        </div>
      </header>

      {level === "categories" ? (
        <div className="catalog-tier catalog-tier--categories" role="list" aria-label="Catégories">
          {categories.map((category) => {
            const slug = slugForCategory(category);
            const tone = toneForCatalogSlug(slug);
            const mark = markForCatalogSlug(slug);
            const rubriqueCount = subcategoriesByCategory.get(category.id)?.length ?? 0;
            const categoryItems = itemsByCategory.get(category.id) ?? [];
            const contentMix = summarizeContentMix(categoryItems);
            return (
              <button
                key={category.id}
                type="button"
                role="listitem"
                className="catalog-tierCard"
                data-category-slug={slug}
                data-tone={tone}
                onClick={() => onSelectCategory(category.id)}
              >
                {mark ? (
                  <span className="catalog-tierCard__mark" aria-hidden="true">
                    {mark}
                  </span>
                ) : null}
                <span className="catalog-tierCard__eyebrow">Catégorie</span>
                <span className="catalog-tierCard__title">{categoryChipLabel(category)}</span>
                <span className="catalog-tierCard__desc">
                  {category.description?.trim() || categoryCatalogLede(category, categoryItems.length)}
                </span>
                <span className="catalog-tierCard__meta">
                  {rubriqueCount > 0
                    ? `${rubriqueCount} rubrique${rubriqueCount > 1 ? "s" : ""}`
                    : "Aucune rubrique"}
                  {categoryItems.length > 0 ? ` · ${contentMix}` : ""}
                </span>
                <span className="catalog-tierCard__cta" aria-hidden="true">
                  Explorer
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {level === "subcategories" && selectedCategory ? (
        isLoading ? (
          <p className="contenus-pending muted" role="status">
            Chargement des rubriques…
          </p>
        ) : subcategories.filter((s) => s.category_id === selectedCategoryId).length === 0 ? (
          <p className="contenus-empty muted">Aucune rubrique dans cette catégorie pour le moment.</p>
        ) : (
          <div
            className="catalog-tier catalog-tier--subcategories"
            role="list"
            aria-label={`Rubriques — ${categoryChipLabel(selectedCategory)}`}
          >
            {subcategories
              .filter((s) => s.category_id === selectedCategoryId)
              .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "fr"))
              .map((sub) => {
                const subItems = itemsBySubcategory.get(sub.id) ?? [];
                const subMix = summarizeContentMix(subItems);
                const slug = slugForCategory(selectedCategory);
                const tone = toneForCatalogSlug(slug);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    role="listitem"
                    className="catalog-tierCard catalog-tierCard--sub"
                    data-category-slug={slug}
                    data-tone={tone}
                    onClick={() => onSelectSubcategory(sub.id)}
                  >
                    <span className="catalog-tierCard__eyebrow">Rubrique</span>
                    <span className="catalog-tierCard__title">{sub.name}</span>
                    {sub.description?.trim() ? (
                      <span className="catalog-tierCard__desc">{sub.description}</span>
                    ) : null}
                    <span className="catalog-tierCard__meta">
                      {subItems.length === 0 ? "Aucun contenu" : subMix}
                    </span>
                    <span className="catalog-tierCard__cta" aria-hidden="true">
                      Voir
                    </span>
                  </button>
                );
              })}
          </div>
        )
      ) : null}

      {level === "contents" ? children : null}
    </>
  );
}
