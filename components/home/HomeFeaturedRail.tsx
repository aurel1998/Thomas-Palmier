"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useMemo } from "react";
import type { Content } from "../../types/content";
import { articleExcerpt, plainBodyTeaser } from "../../lib/articleExcerpt";
import { ContentImage } from "../media/ContentImage";
import { VideoPlayer } from "../media/VideoPlayer";

type HomeFeaturedRailProps = {
  items?: Content[];
};

function sortForRail(contents: Content[]): Content[] {
  const seen = new Set<string>();
  const sorted = [...contents].sort((a, b) => {
    const fa = a.is_featured ? 1 : 0;
    const fb = b.is_featured ? 1 : 0;
    if (fb !== fa) return fb - fa;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const out: Content[] = [];
  for (const c of sorted) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
    if (out.length >= 14) break;
  }
  return out;
}

function RailSlide({ item, tone }: { item: Content; tone: number }) {
  const isVideo = item.type === "video";
  const isAudio = item.type === "audio";
  const desc = isVideo
    ? plainBodyTeaser(item.content, 96)
    : isAudio
      ? plainBodyTeaser(item.content, 96)
      : articleExcerpt(item.content, 140) || "";

  return (
    <article
      className="home-rail-slide"
      data-content-id={item.id}
      data-rail-tone={String(tone % 6)}
    >
      <div className="home-rail-slide__media">
        {isVideo ? (
          <VideoPlayer
            src={item.content}
            poster={item.image_url}
            title={item.title}
            className="home-rail-slide__player"
          />
        ) : isAudio ? (
          item.image_url ? (
            <ContentImage
              src={item.image_url}
              alt=""
              fill
              sizes="280px"
              className="home-rail-slide__cover"
            />
          ) : (
            <div className="home-rail-slide__coverFallback" aria-hidden />
          )
        ) : item.image_url ? (
          <ContentImage
            src={item.image_url}
            alt=""
            fill
            sizes="280px"
            className="home-rail-slide__cover"
          />
        ) : (
          <div className="home-rail-slide__coverFallback" aria-hidden />
        )}
      </div>
      <div className="home-rail-slide__body">
        <span className="home-rail-slide__cat">{item.tags[0] ?? "Récit"}</span>
        <Link href={`/mes-contenus/${item.id}`} className="home-rail-slide__titleLink">
          <span className="home-rail-slide__title">{item.title}</span>
        </Link>
        {desc ? <p className="home-rail-slide__desc">{desc}</p> : null}
      </div>
    </article>
  );
}

/**
 * Bandeau plein champ : cartes serrées, média seul puis texte (pas de titre sur la vignette).
 * Défilement en boucle (pause au survol, désactivé si prefers-reduced-motion).
 */
export function HomeFeaturedRail({ items = [] }: HomeFeaturedRailProps) {
  const rail = useMemo(() => sortForRail(items), [items]);
  if (!rail.length) {
    return (
      <p className="muted home-une__empty home-rail__empty" role="status">
        Les prochains contenus apparaîtront ici.
      </p>
    );
  }

  const loop = [...rail, ...rail];

  return (
    <div
      className="home-rail"
      style={{ "--home-rail-items": rail.length } as CSSProperties}
      aria-roledescription="carrousel"
      aria-label="Sélection en continu"
    >
      <div className="home-rail__viewport">
        <div className="home-rail__track">
          {loop.map((item, i) => (
            <div key={`${item.id}-${i}`} className="home-rail__cell">
              <RailSlide item={item} tone={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
