"use client";

import type { Content } from "../../types/content";
import type { Subcategory } from "../../types/subcategory";
import { FeatureContentCard } from "./FeatureContentCard";
import { CatalogVideoThumb } from "./CatalogVideoThumb";

type CatalogLandingSpotlightProps = {
  featured: Content | null;
  recentVideos: Content[];
  tvSubcategories: Subcategory[];
  isLoading?: boolean;
  onOpenTvCategory: () => void;
  onOpenRubrique: (subcategoryId: string) => void;
};

export function CatalogLandingSpotlight({
  featured,
  recentVideos,
  tvSubcategories,
  isLoading,
  onOpenTvCategory,
  onOpenRubrique,
}: CatalogLandingSpotlightProps) {
  if (isLoading) {
    return (
      <p className="contenus-pending muted catalog-spotlight__pending" role="status">
        Chargement des vidéos…
      </p>
    );
  }

  if (!featured && recentVideos.length === 0) return null;

  const gridVideos = featured
    ? recentVideos.filter((v) => v.id !== featured.id).slice(0, 7)
    : recentVideos.slice(0, 8);

  return (
    <div className="catalog-spotlight">
      {featured ? (
        <section className="catalog-spotlight__featured" aria-label="Vidéo à la une">
          <FeatureContentCard item={featured} />
        </section>
      ) : null}

      {gridVideos.length > 0 ? (
        <section className="catalog-spotlight__recent" aria-labelledby="catalog-recent-videos">
          <div className="catalog-spotlight__recentHead">
            <div>
              <h2 id="catalog-recent-videos" className="catalog-spotlight__heading">
                Dernières vidéos
              </h2>
              <p className="catalog-spotlight__sub">
                Accès direct — cliquez pour regarder, sans parcourir les rubriques.
              </p>
            </div>
            <button type="button" className="catalog-spotlight__allBtn" onClick={onOpenTvCategory}>
              Tout le catalogue TV
            </button>
          </div>
          <div className="catalog-spotlight__grid" role="list">
            {gridVideos.map((item) => (
              <div key={item.id} role="listitem">
                <CatalogVideoThumb item={item} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tvSubcategories.length > 0 ? (
        <nav className="catalog-quickNav" aria-label="Rubriques TV">
          <p className="catalog-quickNav__label">TV — accès rapide</p>
          <div className="catalog-quickNav__chips">
            {tvSubcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                className="catalog-quickNav__chip"
                onClick={() => onOpenRubrique(sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
