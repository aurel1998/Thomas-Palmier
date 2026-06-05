"use client";

import type { Content } from "../../types/content";
import { FeatureContentCard } from "../contenus/FeatureContentCard";

type FeatureStorySectionProps = {
  item: Content;
};

/**
 * Mise en avant éditoriale — contenu principal du moment (accueil + catalogue).
 */
export function FeatureStorySection({ item }: FeatureStorySectionProps) {
  return (
    <section className="home-feature-story" aria-labelledby="home-feature-story-heading">
      <div className="home-une__focus">
        <header className="home-sectionHead home-une__head">
          <div>
            <p className="home-sectionEyebrow">À la une</p>
            <h2 id="home-feature-story-heading" className="home-sectionTitle">
              Feature story
            </h2>
            <p className="home-une__lede muted">
              Le récit principal du moment — sélectionné depuis l&apos;administration.
            </p>
          </div>
          <div className="home-sectionRule" aria-hidden="true" />
        </header>
        <FeatureContentCard item={item} />
      </div>
    </section>
  );
}
