"use client";

import { useMemo, useState } from "react";
import type { Content } from "../../types/content";
import type { Subcategory } from "../../types/subcategory";
import { FeatureContentCard } from "./FeatureContentCard";
import { CatalogVideoThumb } from "./CatalogVideoThumb";

type CatalogVideoGalleryProps = {
  featured: Content | null;
  videos: Content[];
  tvSubcategories: Subcategory[];
  isLoading?: boolean;
};

/**
 * Accueil catalogue : toutes les vidéos visibles, filtre rubrique sans changer de page.
 */
export function CatalogVideoGallery({
  featured,
  videos,
  tvSubcategories,
  isLoading,
}: CatalogVideoGalleryProps) {
  const [rubriqueId, setRubriqueId] = useState<string>("all");

  const filteredVideos = useMemo(() => {
    const base = featured ? videos.filter((v) => v.id !== featured.id) : videos;
    if (rubriqueId === "all") return base;
    return base.filter((v) => v.subcategory_id === rubriqueId);
  }, [videos, featured, rubriqueId]);

  if (isLoading) {
    return (
      <p className="contenus-pending muted catalog-spotlight__pending" role="status">
        Chargement des vidéos…
      </p>
    );
  }

  if (!featured && videos.length === 0) {
    return (
      <p className="contenus-empty muted">
        Les premières vidéos seront bientôt disponibles ici.
      </p>
    );
  }

  return (
    <div className="catalog-spotlight catalog-spotlight--gallery">
      {featured ? (
        <section className="catalog-spotlight__featured" aria-label="À la une">
          <FeatureContentCard item={featured} />
        </section>
      ) : null}

      {tvSubcategories.length > 0 ? (
        <div
          className="catalog-formatFilter catalog-formatFilter--rubriques"
          role="tablist"
          aria-label="Filtrer par rubrique TV"
        >
          <button
            type="button"
            role="tab"
            aria-selected={rubriqueId === "all"}
            className={`catalog-formatFilter__chip${rubriqueId === "all" ? " is-active" : ""}`}
            onClick={() => setRubriqueId("all")}
          >
            Toutes ({videos.length})
          </button>
          {tvSubcategories.map((sub) => {
            const count = videos.filter((v) => v.subcategory_id === sub.id).length;
            if (count === 0) return null;
            return (
              <button
                key={sub.id}
                type="button"
                role="tab"
                aria-selected={rubriqueId === sub.id}
                className={`catalog-formatFilter__chip${rubriqueId === sub.id ? " is-active" : ""}`}
                onClick={() => setRubriqueId(sub.id)}
              >
                {sub.name} ({count})
              </button>
            );
          })}
        </div>
      ) : null}

      {filteredVideos.length > 0 ? (
        <section className="catalog-spotlight__recent" aria-labelledby="catalog-all-videos">
          <h2 id="catalog-all-videos" className="catalog-spotlight__heading catalog-spotlight__heading--sr">
            Vidéos
          </h2>
          <div className="catalog-spotlight__grid" role="list">
            {filteredVideos.map((item) => (
              <div key={item.id} role="listitem">
                <CatalogVideoThumb item={item} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="contenus-empty muted">Aucune vidéo dans cette rubrique.</p>
      )}
    </div>
  );
}
