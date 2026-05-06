"use client";

import gsap from "gsap";
import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  CREDIBILITY_AWARDS,
  CREDIBILITY_MEDIA,
  CREDIBILITY_PARTNERS,
  type CredibilityLogoItem,
} from "../../lib/credibility";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";

function LogoTile({ item }: { item: CredibilityLogoItem }) {
  const hasLogo = Boolean(item.logoSrc);

  return (
    <div className="credibility__logoTile" data-cred-item>
      <div
        className={
          hasLogo
            ? "credibility__logoFrame credibility__logoFrame--img"
            : "credibility__logoFrame"
        }
      >
        {hasLogo && item.logoSrc ? (
          <Image
            src={item.logoSrc}
            alt=""
            fill
            className="credibility__logoImg"
            sizes="112px"
          />
        ) : (
          <span className="credibility__logoInitials">
            {item.initials ?? item.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="credibility__logoName">{item.name}</span>
    </div>
  );
}

/**
 * Section crédibilité : récompenses, médias, collaborations — logos + badges,
 * apparition fade + stagger (GSAP ScrollTrigger).
 */
export function CredibilitySection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    if (isReducedMotion()) {
      gsap.set(root.querySelectorAll("[data-cred-item]"), { clearProps: "all" });
      return;
    }

    ensureScrollTrigger();

    const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-cred-item]"));

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: motion.duration.revealMed,
          ease: motion.ease.out,
          stagger: {
            each: motion.duration.stagger,
            from: "start",
          },
          scrollTrigger: {
            trigger: root,
            start: motion.scroll.startReveal,
            toggleActions: motion.scroll.toggleOnce,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="credibility"
      id="credibilite"
      aria-labelledby="credibility-heading"
    >
      <div className="container credibility__container">
        <header className="credibility__head" data-cred-item>
          <div className="home-sectionEyebrow">Réassurance</div>
          <h2 id="credibility-heading" className="credibility__title">
            Une plume reconnue
          </h2>
          <p className="muted credibility__intro">
            Distinctions, visibilité médiatique et partenariats — repères pour situer le travail
            journalistique derrière chaque contenu.
          </p>
        </header>

        <div className="credibility__grid">
          <div className="credibility__column">
            <h3 className="credibility__tierTitle" data-cred-item>
              <span className="credibility__tierIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 2l2.9 6.62L22 9.75l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.62 2 9.75l7.1-1.13L12 2z" />
                </svg>
              </span>
              Récompenses
            </h3>
            <ul className="credibility__awardList">
              {CREDIBILITY_AWARDS.map((a) => (
                <li key={a.id} className="credibility__award" data-cred-item>
                  <span className="credibility__awardBadge" aria-hidden="true">
                    {a.year ?? "•"}
                  </span>
                  <div className="credibility__awardBody">
                    <span className="credibility__awardName">{a.title}</span>
                    {a.subtitle ? <span className="credibility__awardMeta">{a.subtitle}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="credibility__column">
            <h3 className="credibility__tierTitle" data-cred-item>
              <span className="credibility__tierIcon credibility__tierIcon--media" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2zm12 1l4 3v-8l-4 3z" />
                </svg>
              </span>
              Médias
            </h3>
            <p className="credibility__tierHint muted" data-cred-item>
              Passages et citations
            </p>
            <div className="credibility__logoRow">
              {CREDIBILITY_MEDIA.map((item) => (
                <LogoTile key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="credibility__column">
            <h3 className="credibility__tierTitle" data-cred-item>
              <span className="credibility__tierIcon credibility__tierIcon--partners" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                </svg>
              </span>
              Collaborations
            </h3>
            <p className="credibility__tierHint muted" data-cred-item>
              Institutions &amp; événements
            </p>
            <div className="credibility__logoRow">
              {CREDIBILITY_PARTNERS.map((item) => (
                <LogoTile key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
