"use client";

import { useMemo } from "react";
import type { Content } from "../../types/content";
import type { Category } from "../../types/category";
import { ContenuCard } from "../contenus/ContenuCard";

type EditorialSelectionSectionProps = {
  initialContents?: Content[];
  categories?: Category[];
  /** IDs à ne pas afficher dans les rails (ex. récit déjà mis en avant). */
  excludeIds?: string[];
};

/**
 * Sélection éditoriale : classement par intention (tags), pas par format.
 * Rails en défilement horizontal.
 */
export function EditorialSelectionSection({
  initialContents,
  categories = [],
  excludeIds = [],
}: EditorialSelectionSectionProps) {
  const excludeSet = useMemo(() => new Set(excludeIds.filter(Boolean)), [excludeIds]);
  const hasContents = Boolean(initialContents?.length);

  const rails = useMemo(() => {
    const byCategory = new Map<string, Content[]>();
    for (const item of initialContents ?? []) {
      if (excludeSet.has(item.id)) continue;
      if (!item.category_id) continue;
      const current = byCategory.get(item.category_id) ?? [];
      current.push(item);
      byCategory.set(item.category_id, current);
    }

    return categories
      .map((category) => ({
        category,
        items: byCategory.get(category.id) ?? [],
      }))
      .filter((x) => x.items.length > 0);
  }, [categories, initialContents, excludeSet]);

  const showCategoryHint = hasContents && rails.length === 0;

  if (!hasContents) return null;

  return (
    <section
      className="editorial-selection"
      aria-labelledby="editorial-selection-heading"
    >
      <div className="container editorial-selection__container">
        <div className="editorial-selection__intro">
          <div>
            <div className="home-sectionEyebrow">Parcours éditorial</div>
            <h2 id="editorial-selection-heading" className="home-sectionTitle">
              Sélection éditoriale
            </h2>
            <p className="muted editorial-selection__lede">
              Les contenus sont regroupés par catégorie éditoriale (Analyses, Enquêtes, Coulisses...)
              dans des rails horizontaux fluides.
            </p>
          </div>
          <div className="home-sectionRule" aria-hidden="true" />
        </div>

        {showCategoryHint ? (
          <p className="muted editorial-selection__hint" role="status">
            La sélection par catégories arrive avec les prochaines publications.
          </p>
        ) : null}

        {rails.map((rail) => (
          <EditorialRail
            key={rail.category.id}
            categoryId={rail.category.id}
            label={rail.category.name}
            lede={rail.category.description || "Sélection de contenus de cette catégorie."}
            items={rail.items}
          />
        ))}
      </div>
    </section>
  );
}

function EditorialRail({
  categoryId,
  label,
  lede,
  items,
}: {
  categoryId: string;
  label: string;
  lede: string;
  items: Content[];
}) {
  if (!items.length) return null;

  const railId = `editorial-rail-${categoryId}`;

  return (
    <div className="editorial-rail" data-editorial-category={categoryId}>
      <div className="editorial-rail__head">
        <h3 className="editorial-rail__title" id={railId}>
          {label}
        </h3>
        <p className="editorial-rail__lede muted">{lede}</p>
      </div>
      <div className="editorial-rail__viewport" tabIndex={0}>
        <ul className="editorial-rail__track" role="list" aria-labelledby={railId}>
          {items.map((item) => (
            <li key={item.id} className="editorial-rail__cell">
              <ContenuCard item={item} intentRail />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
