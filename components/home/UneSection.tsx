"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import type { Content } from "../../types/content";
import { FeatureContentCard } from "../contenus/FeatureContentCard";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";

type UneSectionProps = {
  /** Contenus du serveur : la une = 2ᵉ publication (la 1ʳᵉ est le Feature Story). */
  initialContents?: Content[];
};

export function UneSection({ initialContents }: UneSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  const featured = useMemo<Content | null>(() => {
    if (!initialContents?.length) return null;
    return initialContents[1] ?? null;
  }, [initialContents]);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;

    if (isReducedMotion()) {
      gsap.set(card, { clearProps: "clipPath" });
      return;
    }

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        card,
        { clipPath: "inset(0% 100% 0 0)", autoAlpha: 0, y: 20 },
        {
          clipPath: "inset(0% 0% 0 0)",
          autoAlpha: 1,
          y: 0,
          immediateRender: false,
          duration: motion.duration.reveal,
          ease: motion.ease.out,
          scrollTrigger: {
            trigger: card,
            start: motion.scroll.startCards,
            toggleActions: motion.scroll.toggleOnce,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [featured?.id]);

  return (
    <section ref={sectionRef} className="home-une" aria-label="À la une">
      <div className="container">
        <div className="home-sectionHead">
          <div>
            <div className="home-sectionEyebrow">Mise en avant</div>
            <h2 className="home-sectionTitle">À la une</h2>
            <p className="muted home-une__lede">
              Une sélection courte des contenus à retenir.
            </p>
          </div>
          <div className="home-sectionRule" aria-hidden="true" />
        </div>

        {featured ? (
          <FeatureContentCard ref={cardRef} item={featured} />
        ) : (
          <p className="muted home-une__empty" role="status">
            Nouveaux contenus à la une très bientôt.
          </p>
        )}
      </div>
    </section>
  );
}
