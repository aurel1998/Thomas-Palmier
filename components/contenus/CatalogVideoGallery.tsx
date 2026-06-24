"use client";

import { useMemo, useRef, useState } from "react";
import type { Content } from "../../types/content";
import type { Subcategory } from "../../types/subcategory";
import { FeatureContentCard } from "./FeatureContentCard";
import { CatalogVideoThumb } from "./CatalogVideoThumb";
import { CatalogRubriqueRail } from "./CatalogRubriqueRail";

type CatalogVideoGalleryProps = {
  featured: Content | null;
  videos: Content[];
  tvSubcategories: Subcategory[];
  isLoading?: boolean;
};

/**
 * Accueil catalogue : rubriques visibles + toutes les vidéos en grille (filtrable).
 */
export function CatalogVideoGallery({
  featured,
  videos,
  tvSubcategories,
  isLoading,
}: CatalogVideoGalleryProps) {
  const [rubriqueId, setRubriqueId] = useState<string>("all");
  const gridRef = useRef<HTMLElement | null>(null);

  const filteredVideos = useMemo(() => {
    const base = featured ? videos.filter((v) => v.id !== featured.id) : videos;
    if (rubriqueId === "all") return base;
    return base.filter((v) => v.subcategory_id === rubriqueId);
  }, [videos, featured, rubriqueId]);

  const handleRubriqueSelect = (id: string) => {
    setRubriqueId(id);
    requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (isLoading) {
    return (
      <p className="contenus-pending muted catalog-spotlight__pending" role="status">
        Chargement des vidéos…
      </p>
    );
  }

  if (!featured && videos.length === 0) {
    return (
      <div className="catalog-spotlight__empty">
        <p className="contenus-empty muted">
          Le catalogue vidéo est en cours de mise en ligne.
        </p>
        <a
          href="https://www.youtube.com/@thomaspalmiertv"
          className="catalog-spotlight__ytLink"
          target="_blank"
          rel="noopener noreferrer"
        >
          Voir les vidéos sur YouTube
        </a>
      </div>
    );
  }

  return (
    <div className="catalog-spotlight catalog-spotlight--gallery">
      <CatalogRubriqueRail
        rubriques={tvSubcategories}
        videos={videos}
        activeRubriqueId={rubriqueId}
        onSelectRubrique={handleRubriqueSelect}
      />

      {featured ? (
        <section className="catalog-spotlight__featured" aria-label="À la une">
          <FeatureContentCard item={featured} />
        </section>
      ) : null}

      {filteredVideos.length > 0 ? (
        <section
          ref={gridRef}
          className="catalog-spotlight__recent"
          aria-labelledby="catalog-all-videos"
        >
          <h2 id="catalog-all-videos" className="catalog-sectionHeading">
            {rubriqueId === "all"
              ? "Toutes les vidéos"
              : (tvSubcategories.find((s) => s.id === rubriqueId)?.name ?? "Vidéos")}
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
