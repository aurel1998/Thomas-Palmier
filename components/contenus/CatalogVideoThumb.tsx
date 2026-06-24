"use client";

import Link from "next/link";
import type { Content } from "../../types/content";
import { plainBodyTeaser } from "../../lib/articleExcerpt";
import { ContentImage } from "../media/ContentImage";

/**
 * Carte vidéo compacte — vignette cliquable vers la page détail (catalogue).
 */
export function CatalogVideoThumb({ item }: { item: Content }) {
  const teaser = plainBodyTeaser(item.content, 88);

  return (
    <Link href={`/mes-contenus/${item.id}`} className="catalog-videoThumb">
      <div className="catalog-videoThumb__media">
        {item.image_url ? (
          <ContentImage
            src={item.image_url}
            alt=""
            fill
            sizes="(max-width: 640px) 42vw, 280px"
            className="catalog-videoThumb__img"
          />
        ) : (
          <span className="catalog-videoThumb__fallback" aria-hidden="true" />
        )}
        <span className="catalog-videoThumb__play" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M8 5.14v13.72L19 12 8 5.14z" />
          </svg>
        </span>
      </div>
      <div className="catalog-videoThumb__body">
        {item.tags[0] ? <span className="catalog-videoThumb__tag">{item.tags[0]}</span> : null}
        <span className="catalog-videoThumb__title">{item.title}</span>
        {teaser ? <span className="catalog-videoThumb__teaser">{teaser}</span> : null}
      </div>
    </Link>
  );
}
