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
  article: "Publication",
  audio: "Audio",
};

export type FeatureContentCardProps = {
  item: Content;
  className?: string;
};

/**
 * Carte mise en avant : média plein cadre (sans texte par-dessus), métadonnées et titre sous la vignette.
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

    const videoTeaser = item.type === "video" ? plainBodyTeaser(item.content, 160) : "";

    const rootClass = `contenus-feature contenus-feature--stacked ${featureKind}${
      className ? ` ${className}` : ""
    }`.trim();

    return (
      <article ref={ref} className={rootClass} data-content-id={item.id}>
        <div className="contenus-feature__media">
          {item.type === "video" ? (
            <VideoPlayer
              src={item.content}
              poster={item.image_url}
              title={item.title}
              className="contenus-feature__player"
            />
          ) : item.type === "audio" ? (
            item.image_url ? (
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
            )
          ) : item.image_url ? (
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
        </div>

        <div className="contenus-feature__bodyStack">
          <div className="contenus-feature__meta">
            <span className="tag tag-muted">{item.tags[0] ?? "Récit"}</span>
            <span className="contenus-feature__format">{typeLabels[item.type]}</span>
          </div>
          <h3 className="contenus-feature__title">{item.title}</h3>
          {item.type === "video" && videoTeaser ? (
            <p className="contenus-feature__videoTeaser">{videoTeaser}</p>
          ) : null}
          {item.type === "article" && articleTeaser ? (
            <p className="contenus-feature__articleTeaser">{articleTeaser}</p>
          ) : null}
          {item.type === "article" ? (
            <Link href={`/mes-contenus/${item.id}`} className="contenus-feature__readLink">
              Lire l&apos;article
            </Link>
          ) : item.type === "audio" ? (
            <Link href={`/mes-contenus/${item.id}`} className="contenus-feature__readLink">
              Écouter
            </Link>
          ) : null}
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
