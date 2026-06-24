"use client";

import type { Content } from "../../types/content";
import type { Subcategory } from "../../types/subcategory";

type CatalogRubriqueRailProps = {
  rubriques: Subcategory[];
  videos: Content[];
  activeRubriqueId: string;
  onSelectRubrique: (rubriqueId: string) => void;
};

function previewForRubrique(videos: Content[], rubriqueId: string): string | undefined {
  const item = videos.find((v) => v.subcategory_id === rubriqueId);
  return item?.image_url;
}

/**
 * Rubriques TV en cartes visuelles — filtre la grille vidéo sans quitter la page.
 */
export function CatalogRubriqueRail({
  rubriques,
  videos,
  activeRubriqueId,
  onSelectRubrique,
}: CatalogRubriqueRailProps) {
  if (rubriques.length === 0) return null;

  return (
    <section className="catalog-rubriques" aria-labelledby="catalog-rubriques-heading">
      <h2 id="catalog-rubriques-heading" className="catalog-sectionHeading">
        Rubriques TV
      </h2>
      <div className="catalog-rubriqueRail" role="tablist" aria-label="Rubriques TV">
        <button
          type="button"
          role="tab"
          aria-selected={activeRubriqueId === "all"}
          className={`catalog-rubriqueCard${activeRubriqueId === "all" ? " is-active" : ""}`}
          onClick={() => onSelectRubrique("all")}
        >
          <span className="catalog-rubriqueCard__media catalog-rubriqueCard__media--all" aria-hidden="true">
            <span className="catalog-rubriqueCard__allLabel">Toutes</span>
          </span>
          <span className="catalog-rubriqueCard__body">
            <span className="catalog-rubriqueCard__title">Toutes les vidéos</span>
            <span className="catalog-rubriqueCard__meta">{videos.length} vidéo{videos.length > 1 ? "s" : ""}</span>
          </span>
        </button>

        {rubriques.map((sub) => {
          const count = videos.filter((v) => v.subcategory_id === sub.id).length;
          if (count === 0) return null;
          const thumb = previewForRubrique(videos, sub.id);
          return (
            <button
              key={sub.id}
              type="button"
              role="tab"
              aria-selected={activeRubriqueId === sub.id}
              className={`catalog-rubriqueCard${activeRubriqueId === sub.id ? " is-active" : ""}`}
              onClick={() => onSelectRubrique(sub.id)}
            >
              {thumb ? (
                <span className="catalog-rubriqueCard__media" aria-hidden="true">
                  <img src={thumb} alt="" loading="lazy" decoding="async" />
                </span>
              ) : (
                <span className="catalog-rubriqueCard__media catalog-rubriqueCard__media--empty" aria-hidden="true" />
              )}
              <span className="catalog-rubriqueCard__body">
                <span className="catalog-rubriqueCard__title">{sub.name}</span>
                {sub.description?.trim() ? (
                  <span className="catalog-rubriqueCard__desc">{sub.description}</span>
                ) : null}
                <span className="catalog-rubriqueCard__meta">
                  {count} vidéo{count > 1 ? "s" : ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
