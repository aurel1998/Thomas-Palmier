"use client";

import { useEffect, useState } from "react";
import type { Content } from "../../types/content";
import { isReducedMotion } from "../../lib/gsapMotion";
import { extractYouTubeId } from "../../lib/youtube";
import { VideoPlayer } from "../media/VideoPlayer";

type RecentYoutubeSectionProps = {
  items: Content[];
};

/**
 * Bande « Vidéos récentes » : uniquement YouTube, défilement horizontal,
 * prévisualisation embed au survol (pointeur fin), lecture plein écran via modale.
 */
export function RecentYoutubeSection({ items }: RecentYoutubeSectionProps) {
  if (!items.length) return null;

  return (
    <section className="recent-yt" aria-labelledby="recent-yt-heading">
      <div className="container recent-yt__container">
        <div className="recent-yt__intro">
          <div>
            <div className="home-sectionEyebrow">YouTube</div>
            <h2 id="recent-yt-heading" className="home-sectionTitle">
              Vidéos récentes
            </h2>
            <p className="muted recent-yt__lede">
              Extraits du catalogue — la lecture démarre directement dans la carte, sans pop-up.
            </p>
          </div>
          <div className="home-sectionRule" aria-hidden="true" />
        </div>

        <div className="recent-yt__viewport" tabIndex={0}>
          <ul className="recent-yt__track" role="list">
            {items.map((item) => (
              <li key={item.id} className="recent-yt__cell">
                <YoutubeHoverCard item={item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function YoutubeHoverCard({ item }: { item: Content }) {
  const ytId = extractYouTubeId(item.content);
  const [hover, setHover] = useState(false);
  const [fineHover, setFineHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFineHover(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const reduced = isReducedMotion();
  const autoplayAmbient = Boolean(ytId && fineHover && !reduced && hover);

  return (
    <article
      className="recent-yt-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="recent-yt-card__media">
        <VideoPlayer
          src={item.content}
          poster={item.image_url}
          title={item.title}
          autoplay={autoplayAmbient}
          className="recent-yt-card__video"
        />
        <div className="recent-yt-card__shade" aria-hidden="true" />
      </div>
      <div className="recent-yt-card__body">
        <h3 className="recent-yt-card__title">{item.title}</h3>
      </div>
    </article>
  );
}
