"use client";

import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import type { Content } from "../../types/content";
import { ContenuCard } from "../contenus/ContenuCard";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";

/** Démo locale si aucun contenu serveur (même mix que le catalogue). */
const RECENT_FALLBACK: Content[] = [
  {
    id: "hf-a1",
    type: "article",
    title: "Duel décisif et bascule tactique",
    content: "Analyse des séquences clés et des ajustements collectifs.",
    image_url: "/src/joueurs/joueur9.jpg",
    tags: ["Action"],
    created_at: "2026-03-18T08:30:00.000Z",
  },
  {
    id: "hf-au1",
    type: "audio",
    title: "Chronique tribunes et émotion brute",
    content: "https://example.com/audio/chronique-tribunes",
    image_url: "/src/stade/stade6.jpg",
    tags: ["Reportage"],
    created_at: "2026-03-16T09:45:00.000Z",
  },
  {
    id: "hf-v2",
    type: "video",
    title: "Plongée immersive au cœur du stade",
    content: "/src/video/video9.mp4",
    image_url: "/src/stade/stade1.jpg",
    tags: ["Immersion"],
    created_at: "2026-03-14T11:20:00.000Z",
  },
  {
    id: "hf-a2",
    type: "article",
    title: "Rythme collectif et transitions",
    content: "Comment le groupe tient la ligne et referme les espaces.",
    image_url: "/src/stade/stade4.jpg",
    tags: ["Tactique"],
    created_at: "2026-03-12T10:00:00.000Z",
  },
  {
    id: "hf-v3",
    type: "video",
    title: "Lecture du tempo en pleine intensité",
    content: "/src/video/video9.mp4",
    image_url: "/src/stade/stade4.jpg",
    tags: ["Action"],
    created_at: "2026-03-10T09:00:00.000Z",
  },
  {
    id: "hf-au2",
    type: "audio",
    title: "Tension et bruit des tribunes avant coup d’envoi",
    content: "https://example.com/audio/ambiance-stade",
    image_url: "/src/joueurs/joueur10.jpg",
    tags: ["Stade"],
    created_at: "2026-03-08T08:00:00.000Z",
  },
];

type RecentContentsProps = {
  initialContents?: Content[];
};

/**
 * Fleuve éditorial : cartes dans un rythme visuel variable (sans répéter l’ouverture).
 */
export function RecentContents({ initialContents }: RecentContentsProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  const recentCards = useMemo<Content[]>(() => {
    if (!initialContents?.length) return RECENT_FALLBACK;
    if (initialContents.length <= 1) return [];
    return initialContents.slice(2, 8);
  }, [initialContents]);

  const usedFallback = !initialContents?.length;

  useEffect(() => {
    const root = sectionRef.current;
    if (!root || isReducedMotion()) return;

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      const head = root.querySelector(".home-sectionHead");
      if (head) {
        gsap.fromTo(
          head,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            immediateRender: false,
            duration: motion.duration.revealMed,
            ease: motion.ease.out,
            scrollTrigger: {
              trigger: root,
              start: motion.scroll.startReveal,
              toggleActions: motion.scroll.togglePlay,
            },
          }
        );
      }

      const cards = root.querySelectorAll(".contenus-card");
      if (cards.length) {
        gsap.fromTo(
          cards,
          { autoAlpha: 0, y: 36, scale: 0.98 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            immediateRender: false,
            duration: motion.duration.revealMed,
            ease: motion.ease.out,
            stagger: motion.duration.stagger,
            scrollTrigger: {
              trigger: root,
              start: motion.scroll.startCards,
              toggleActions: motion.scroll.togglePlay,
            },
          }
        );
      }

      gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".contenus-card__img")).forEach((img) => {
        const card = img.closest(".contenus-card");
        if (!card) return;
        gsap.fromTo(
          img,
          { yPercent: -motion.parallax.yPercent * 0.5 },
          {
            yPercent: motion.parallax.yPercent * 0.5,
            immediateRender: false,
            ease: motion.ease.none,
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: motion.parallax.scrub,
            },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, [recentCards.length, usedFallback]);

  const showSoloHint =
    !usedFallback && initialContents && initialContents.length === 1;

  const showPairHint =
    !usedFallback && initialContents && initialContents.length === 2;

  return (
    <section ref={sectionRef} className="home-recent" aria-label="Contenus récents">
      <div className="container">
        <div className="home-sectionHead">
          <div>
            <div className="home-sectionEyebrow">Dernière édition</div>
            <h2 className="home-sectionTitle">La suite du récit</h2>
            <p className="muted home-recent__lede">
              Sons, images et textes dans le même parcours immersif que « Mes contenus ».
            </p>
          </div>
          <div className="home-sectionRule" aria-hidden="true" />
        </div>

        {showSoloHint ? (
          <p className="muted home-recent__solo" role="status">
            Ce récit occupe aussi la section « Feature Story » ; d’autres contenus apparaîtront ici au fil des publications.
          </p>
        ) : showPairHint ? (
          <p className="muted home-recent__solo" role="status">
            Les deux publications récentes sont mises en avant ci-dessus ; la suite du fleuve débutera avec un troisième contenu.
          </p>
        ) : recentCards.length > 0 ? (
          <div className="home-recent__grid" role="list">
            {recentCards.map((item) => (
              <div key={item.id} className="home-recent__cell" role="listitem">
                <ContenuCard item={item} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
