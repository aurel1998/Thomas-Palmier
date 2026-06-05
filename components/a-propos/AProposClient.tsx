"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { BrandLogo } from "../media/BrandLogo";
import { ContentImage } from "../media/ContentImage";
import {
  bindParallaxYPercent,
  ensureScrollTrigger,
  isReducedMotion,
  motion,
  scrollRevealFadeUp,
} from "../../lib/gsapMotion";
import type { CredibilityItemDto, TimelineStepDto } from "../../types/editorial";

type AProposClientProps = {
  profileImageUrl: string;
  displayName?: string;
  photoCaption?: string;
  bio?: string;
  timeline: TimelineStepDto[];
  awards: CredibilityItemDto[];
  media: CredibilityItemDto[];
};

export function AProposClient({
  profileImageUrl,
  displayName = "",
  photoCaption = "",
  bio,
  timeline,
  awards,
  media,
}: AProposClientProps) {
  const pageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    ensureScrollTrigger();
    const ctx = gsap.context(() => {
      const mediaEl = root.querySelector(".apropos-story__media");
      const img = root.querySelector<HTMLElement>(".apropos-story__mediaImg");
      if (!isReducedMotion() && mediaEl && img) {
        bindParallaxYPercent(img, mediaEl as HTMLElement, motion.parallax.yPercent * 0.72);
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
        <div className="apropos-story__layout">
          {profileImageUrl ? (
            <aside className="apropos-story__media">
              <ContentImage
                src={profileImageUrl}
                alt={displayName ? `${displayName} — portrait` : "Portrait"}
                fill
                priority
                sizes="(max-width: 960px) 100vw, 42vw"
                className="apropos-story__mediaImg"
              />
              <div className="apropos-story__mediaOverlay" />
              {photoCaption ? (
                <div className="apropos-story__mediaLabel">{photoCaption}</div>
              ) : null}
            </aside>
          ) : null}

          <div className="apropos-story__narrative">
            {bio ? (
              <section className="apropos-story__section apropos-story__step apropos-story__intro" aria-labelledby="apropos-bio">
                <div className="apropos-story__sectionHead">
                  <p className="home-sectionEyebrow">Portrait</p>
                  <h2 id="apropos-bio" className="apropos-story__sectionTitle">
                    Biographie
                  </h2>
                </div>
                <p className="apropos-story__bio">{bio}</p>
              </section>
            ) : null}

            {timeline.length > 0 ? (
              <section className="apropos-story__section apropos-story__step" aria-labelledby="apropos-timeline">
                <div className="apropos-story__sectionHead">
                  <p className="home-sectionEyebrow">Parcours</p>
                  <h2 id="apropos-timeline" className="apropos-story__sectionTitle">
                    Timeline éditoriale
                  </h2>
                </div>
                <div className="apropos-story__timeline">
                  {timeline.map((step) => (
                    <article key={step.id} className="apropos-story__timelineItem">
                      <p className="apropos-story__timelinePeriod">{step.period}</p>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {awards.length > 0 ? (
            <section className="apropos-story__section apropos-story__step" aria-labelledby="apropos-awards">
              <div className="apropos-story__sectionHead">
                <p className="home-sectionEyebrow">Crédibilité</p>
                <h2 id="apropos-awards" className="apropos-story__sectionTitle">
                  Récompenses
                </h2>
              </div>
              <ul className="apropos-story__awards">
                {awards.map((award) => (
                  <li key={award.id}>
                    <span className="apropos-story__awardYear">{award.year || "—"}</span>
                    <div>
                      <strong>{award.title}</strong>
                      {award.subtitle ? <p>{award.subtitle}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            ) : null}

            {media.length > 0 ? (
            <section className="apropos-story__section apropos-story__step" aria-labelledby="apropos-medias">
              <div className="apropos-story__sectionHead">
                <p className="home-sectionEyebrow">Diffusion</p>
                <h2 id="apropos-medias" className="apropos-story__sectionTitle">
                  Médias
                </h2>
              </div>
              <div className="apropos-story__mediaLogos">
                {media.map((m) => {
                  const inner = (
                    <BrandLogo
                      name={m.name}
                      logoSrc={m.logo_url || undefined}
                      initials={m.initials || undefined}
                      className="apropos-story__brandLogo"
                    />
                  );
                  return m.link_url?.trim() ? (
                    <a
                      key={m.id}
                      href={m.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="apropos-story__logoTile apropos-story__logoTile--link"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={m.id} className="apropos-story__logoTile">
                      {inner}
                    </div>
                  );
                })}
              </div>
            </section>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
