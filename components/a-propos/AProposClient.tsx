"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { ContentImage } from "../media/ContentImage";
import {
  bindParallaxYPercent,
  ensureScrollTrigger,
  isReducedMotion,
  motion,
  scrollRevealFadeUp,
} from "../../lib/gsapMotion";
import { CREDIBILITY_AWARDS, CREDIBILITY_MEDIA } from "../../lib/credibility";

const TIMELINE = [
  {
    period: "2018 — 2020",
    title: "Premiers terrains",
    text: "Reportages de bord de pelouse et formats live orientés compréhension du jeu.",
  },
  {
    period: "2020 — 2023",
    title: "Montée en expertise",
    text: "Développement des analyses tactiques et des formats multi-supports (vidéo, texte, audio).",
  },
  {
    period: "2023 — aujourd’hui",
    title: "Ligne éditoriale média",
    text: "Production d’histoires sportives premium : contexte, angle, vérification et narration claire.",
  },
] as const;

export function AProposClient({ profileImageUrl }: { profileImageUrl: string }) {
  const pageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    ensureScrollTrigger();
    const ctx = gsap.context(() => {
      const media = root.querySelector(".apropos-story__media");
      const img = root.querySelector<HTMLElement>(".apropos-story__mediaImg");
      if (!isReducedMotion() && media && img) {
        bindParallaxYPercent(img, media as HTMLElement, motion.parallax.yPercent * 0.72);
      }

      const header = root.querySelector(".apropos-story__intro");
      if (header) {
        scrollRevealFadeUp(header, header, {
          y: 26,
          duration: motion.duration.reveal,
          start: motion.scroll.startRevealTight,
          toggleActions: motion.scroll.toggleOnce,
        });
      }

      const steps = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".apropos-story__step"));
      if (steps.length) {
        gsap.fromTo(
          steps,
          { autoAlpha: 0, y: 42 },
          {
            autoAlpha: 1,
            y: 0,
            duration: motion.duration.reveal,
            ease: motion.ease.outLux,
            stagger: motion.duration.stagger,
            scrollTrigger: {
              trigger: root.querySelector(".apropos-story__narrative") ?? root,
              start: motion.scroll.startCards,
              toggleActions: motion.scroll.toggleOnce,
            },
          }
        );
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={pageRef} className="apropos-page apropos-story">
      <div className="container apropos-story__container">
        <header className="apropos-story__intro">
          <p className="home-sectionEyebrow">À propos</p>
          <h1 className="apropos-story__title">Thomas Palmier, journaliste sportif</h1>
          <p className="apropos-story__lead">
            Journaliste de terrain et de décryptage, Thomas construit des récits qui rendent le sport
            lisible, incarné et crédible.
          </p>
        </header>

        <div className="apropos-story__layout">
          <aside className="apropos-story__media">
            <ContentImage
              src={profileImageUrl}
              alt="Thomas Palmier en contexte sportif"
              fill
              priority
              sizes="(max-width: 960px) 100vw, 42vw"
              className="apropos-story__mediaImg"
            />
            <div className="apropos-story__mediaOverlay" />
            <div className="apropos-story__mediaLabel">Journaliste sport · terrain & analyse</div>
          </aside>

          <div className="apropos-story__narrative">
            <section className="apropos-story__section apropos-story__step" aria-labelledby="apropos-timeline">
              <div className="apropos-story__sectionHead">
                <p className="home-sectionEyebrow">Parcours</p>
                <h2 id="apropos-timeline" className="apropos-story__sectionTitle">
                  Timeline éditoriale
                </h2>
              </div>
              <div className="apropos-story__timeline">
                {TIMELINE.map((step) => (
                  <article key={step.period} className="apropos-story__timelineItem">
                    <p className="apropos-story__timelinePeriod">{step.period}</p>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="apropos-story__section apropos-story__step" aria-labelledby="apropos-awards">
              <div className="apropos-story__sectionHead">
                <p className="home-sectionEyebrow">Crédibilité</p>
                <h2 id="apropos-awards" className="apropos-story__sectionTitle">
                  Récompenses
                </h2>
              </div>
              <ul className="apropos-story__awards">
                {CREDIBILITY_AWARDS.map((award) => (
                  <li key={award.id}>
                    <span className="apropos-story__awardYear">{award.year ?? "—"}</span>
                    <div>
                      <strong>{award.title}</strong>
                      {award.subtitle ? <p>{award.subtitle}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="apropos-story__section apropos-story__step" aria-labelledby="apropos-medias">
              <div className="apropos-story__sectionHead">
                <p className="home-sectionEyebrow">Diffusion</p>
                <h2 id="apropos-medias" className="apropos-story__sectionTitle">
                  Médias
                </h2>
              </div>
              <div className="apropos-story__mediaLogos">
                {CREDIBILITY_MEDIA.map((m) => (
                  <div key={m.id} className="apropos-story__logoTile">
                    <span>{m.initials ?? m.name.slice(0, 2).toUpperCase()}</span>
                    <small>{m.name}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
