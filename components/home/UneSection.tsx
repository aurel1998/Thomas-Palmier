"use client";

import type { Content } from "../../types/content";
import { HomeFeaturedRail } from "./HomeFeaturedRail";

type UneSectionProps = {
  initialContents?: Content[];
};

/**
 * Bandeau d’ouverture : défilement horizontal en boucle, sans bloc titre « À la une ».
 * Chaque vignette = média seul + texte dessous (cf. hubs médias premium).
 */
export function UneSection({ initialContents }: UneSectionProps) {
  return (
    <section className="home-une home-une--rail" aria-label="Sélection éditoriale">
      <HomeFeaturedRail items={initialContents} />
    </section>
  );
}
