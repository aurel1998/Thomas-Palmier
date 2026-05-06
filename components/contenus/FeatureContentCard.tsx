"use client";

import { forwardRef } from "react";
import Link from "next/link";
import type { Content, ContentType } from "../../types/content";
import { articleExcerpt, plainBodyTeaser } from "../../lib/articleExcerpt";
import { AudioPlayer } from "../media/AudioPlayer";
import { ContentImage } from "../media/ContentImage";
import { VideoPlayer } from "../media/VideoPlayer";

const typeLabels: Record<ContentType, string> = {
  video: "Vidéo",
  article: "Article",
  audio: "Audio",
};

export type FeatureContentCardProps = {
  item: Content;
  className?: string;
};

/**
 * Carte mise en avant (catalogue ou home) : vidéo / audio / article,
 * même rendu que l’ouverture « À la une » (accueil / Mes contenus).
 */
export const FeatureContentCard = forwardRef<HTMLElement, FeatureContentCardProps>(
  function FeatureContentCard({ item, className = "" }, ref) {
    const featureKind =
      item.type === "video"
        ? "contenus-feature--video"
        : item.type === "audio"
          ? "contenus-feature--audio"
          : "contenus-feature--article";

    const articleTeaser =
      item.type === "article" ? articleExcerpt(item.content) || item.title : "";

    const videoTeaser = item.type === "video" ? plainBodyTeaser(item.content, 140) : "";

    const rootClass = `contenus-feature ${featureKind}${className ? ` ${className}` : ""}`.trim();

    return (
      <article ref={ref} className={rootClass} data-content-id={item.id}>
        <div className="contenus-feature__media">
          {item.type === "video" ? (
            <>
              <VideoPlayer
                src={item.content}
                poster={item.image_url}
                title={item.title}
                className="contenus-feature__player"
              />
              <div className="contenus-feature__shade" aria-hidden="true" />
            </>
          ) : item.type === "audio" ? (
            <>
              {item.image_url ? (
                <ContentImage
                  src={item.image_url}
                  alt={item.title}
                  fill
                  priority
                  sizes="(max-width: 960px) 100vw, min(72vw, 960px)"
                  className="contenus-feature__img"
                />
              ) : (
                <div className="contenus-feature__audioFallback" aria-hidden="true" />
              )}
              <div className="contenus-feature__overlay" aria-hidden="true" />
            </>
          ) : (
            <>
              {item.image_url ? (
                <ContentImage
                  src={item.image_url}
                  alt={item.title}
                  fill
                  priority
                  sizes="(max-width: 960px) 100vw, min(72vw, 960px)"
                  className="contenus-feature__img"
                />
              ) : (
                <div className="contenus-feature__articleFallback" aria-hidden="true" />
              )}
              <div className="contenus-feature__overlay contenus-feature__articleOverlay" aria-hidden="true" />
              <div className="contenus-feature__articleDock">
                <p className="contenus-feature__articleExcerpt">{articleTeaser}</p>
              </div>
            </>
          )}
        </div>
        <div className="contenus-feature__body">
          <div className="contenus-feature__meta">
            <span className="tag tag-muted">{item.tags[0] ?? "Récit"}</span>
            <span className="contenus-feature__format">{typeLabels[item.type]}</span>
          </div>
          <h3 className="contenus-feature__title">{item.title}</h3>
          {videoTeaser ? <p className="contenus-feature__videoTeaser">{videoTeaser}</p> : null}
          <Link href={`/mes-contenus/${item.id}`} className="contenus-feature__readLink">
            Lire le récit
          </Link>
          {item.type === "audio" ? (
            <div className="contenus-feature__audioDock">
              <AudioPlayer src={item.content} title={item.title} variant="default" />
            </div>
          ) : null}
        </div>
      </article>
    );
  }
);
