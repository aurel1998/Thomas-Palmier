"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Content } from "../../types/content";
import { isReducedMotion } from "../../lib/gsapMotion";
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail } from "../../lib/youtube";
import { VideoModal } from "../media/VideoModal";

type RecentYoutubeSectionProps = {
  items: Content[];
};

/**
 * Bande « Vidéos récentes » : uniquement YouTube, défilement horizontal,
 * prévisualisation embed au survol (pointeur fin), lecture plein écran via modale.
 */
export function RecentYoutubeSection({ items }: RecentYoutubeSectionProps) {
  const [modal, setModal] = useState<Content | null>(null);

  if (!items.length) return null;

  return (
    <>
      <section className="recent-yt" aria-labelledby="recent-yt-heading">
        <div className="container recent-yt__container">
          <div className="recent-yt__intro">
            <div>
              <div className="home-sectionEyebrow">YouTube</div>
              <h2 id="recent-yt-heading" className="home-sectionTitle">
                Vidéos récentes
              </h2>
              <p className="muted recent-yt__lede">
                Extraits du catalogue — survolez une carte pour prévisualiser, ouvrez pour regarder
                en grand, sans quitter l’accueil.
              </p>
            </div>
            <div className="home-sectionRule" aria-hidden="true" />
          </div>

          <div className="recent-yt__viewport" tabIndex={0}>
            <ul className="recent-yt__track" role="list">
              {items.map((item) => (
                <li key={item.id} className="recent-yt__cell">
                  <YoutubeHoverCard item={item} onOpen={() => setModal(item)} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <VideoModal
        open={modal !== null}
        onClose={() => setModal(null)}
        src={modal?.content ?? ""}
        title={modal?.title}
        poster={modal?.image_url}
      />
    </>
  );
}

function YoutubeHoverCard({ item, onOpen }: { item: Content; onOpen: () => void }) {
  const ytId = extractYouTubeId(item.content);
  const [hover, setHover] = useState(false);
  const [fineHover, setFineHover] = useState(false);
  const [thumbQuality, setThumbQuality] = useState<"max" | "hq">("max");

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFineHover(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const reduced = isReducedMotion();
  const showEmbed = Boolean(ytId && fineHover && !reduced && hover);

  const thumbSrc = ytId ? getYouTubeThumbnail(ytId, thumbQuality) : item.image_url;
  const embedUrl =
    ytId && showEmbed ? getYouTubeEmbedUrl(ytId, { autoplay: true, mute: true }) : "";

  return (
    <article
      className="recent-yt-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="recent-yt-card__media">
        {showEmbed && embedUrl ? (
          <iframe
            title={`Prévisualisation — ${item.title}`}
            src={embedUrl}
            className="recent-yt-card__iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : thumbSrc ? (
          <Image
            src={thumbSrc}
            alt=""
            fill
            sizes="(max-width: 720px) 78vw, 320px"
            className="recent-yt-card__thumb"
            loading="lazy"
            onError={() => setThumbQuality("hq")}
          />
        ) : (
          <div className="recent-yt-card__thumbFallback" aria-hidden="true" />
        )}
        <div className="recent-yt-card__shade" aria-hidden="true" />
        <button
          type="button"
          className="recent-yt-card__open"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label={`Ouvrir la vidéo : ${item.title}`}
        >
          <span className="recent-yt-card__playGlyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
              <path d="M8 5.14v13.72L19 12 8 5.14z" />
            </svg>
          </span>
        </button>
      </div>
      <div className="recent-yt-card__body">
        <h3 className="recent-yt-card__title">{item.title}</h3>
      </div>
    </article>
  );
}
