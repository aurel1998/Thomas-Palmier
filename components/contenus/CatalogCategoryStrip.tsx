"use client";

import type { Category } from "../../types/category";
import type { Content } from "../../types/content";
import { categoryCatalogLede, categoryChipLabel } from "../../lib/categoryCopy";
import { summarizeContentMix } from "../../lib/catalogContentCopy";
import {
  markForCatalogSlug,
  slugFromCategoryName,
  toneForCatalogSlug,
  type CatalogCategorySlug,
} from "../../lib/fixedCategories";

type CatalogCategoryStripProps = {
  categories: Category[];
  itemsByCategory: Map<string, Content[]>;
  rubriqueCountByCategory: Map<string, number>;
  onSelectCategory: (categoryId: string) => void;
};

function slugForCategory(category: Category): CatalogCategorySlug {
  return slugFromCategoryName(category.name) ?? "radio";
}

/**
 * Les 4 grandes catégories éditoriales — toujours visibles en haut du catalogue.
 */
export function CatalogCategoryStrip({
  categories,
  itemsByCategory,
  rubriqueCountByCategory,
  onSelectCategory,
}: CatalogCategoryStripProps) {
  return (
    <section className="catalog-univers" aria-labelledby="catalog-univers-heading">
      <h2 id="catalog-univers-heading" className="catalog-sectionHeading">
        Univers éditoriaux
      </h2>
      <div className="catalog-tier catalog-tier--categories catalog-tier--strip" role="list">
        {categories.map((category) => {
          const slug = slugForCategory(category);
          const tone = toneForCatalogSlug(slug);
          const mark = markForCatalogSlug(slug);
          const rubriqueCount = rubriqueCountByCategory.get(category.id) ?? 0;
          const categoryItems = itemsByCategory.get(category.id) ?? [];
          const contentMix = summarizeContentMix(categoryItems);
          return (
            <button
              key={category.id}
              type="button"
              role="listitem"
              className="catalog-tierCard catalog-tierCard--strip"
              data-category-slug={slug}
              data-tone={tone}
              onClick={() => onSelectCategory(category.id)}
            >
              {mark ? (
                <span className="catalog-tierCard__mark" aria-hidden="true">
                  {mark}
                </span>
              ) : null}
              <span className="catalog-tierCard__title">{categoryChipLabel(category)}</span>
              <span className="catalog-tierCard__desc catalog-tierCard__desc--strip">
                {category.description?.trim() || categoryCatalogLede(category, categoryItems.length)}
              </span>
              <span className="catalog-tierCard__meta">
                {rubriqueCount > 0
                  ? `${rubriqueCount} rubrique${rubriqueCount > 1 ? "s" : ""}`
                  : "À venir"}
                {categoryItems.length > 0 ? ` · ${contentMix}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
