"use client";

import type { Content } from "../../types/content";
import { VideoPlayer } from "../media/VideoPlayer";

type RecentYoutubeSectionProps = {
  items: Content[];
};

/**
 * Bande « Vidéos récentes » : cartes YouTube en défilement horizontal,
 * lecture inline au clic sans bloquer le scroll de page.
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
              Extraits vidéo publiés récemment.
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
  return (
    <article className="recent-yt-card">
      <div className="recent-yt-card__media">
        <VideoPlayer
          src={item.content}
          poster={item.image_url}
          title={item.title}
          autoplay={false}
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
