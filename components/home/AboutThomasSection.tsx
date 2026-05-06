"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";
import { ContentImage } from "../media/ContentImage";

type AboutThomasSectionProps = {
  portraitSrc?: string;
};

export function AboutThomasSection({ portraitSrc = "/src/joueurs/joueur6.jpg" }: AboutThomasSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mediaInnerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = sectionRef.current;
    const mediaInner = mediaInnerRef.current;
    if (!root) return;

    if (isReducedMotion()) {
      gsap.set(root.querySelectorAll("[data-about-reveal]"), { clearProps: "all" });
      if (mediaInner) gsap.set(mediaInner, { clearProps: "all" });
      return;
    }

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      const reveals = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-about-reveal]"));
      if (reveals.length) {
        gsap.fromTo(
          reveals,
          { autoAlpha: 0, y: 34 },
          {
            autoAlpha: 1,
            y: 0,
            immediateRender: false,
            duration: motion.duration.reveal,
            ease: motion.ease.out,
            stagger: motion.duration.stagger,
            scrollTrigger: {
              trigger: root,
              start: motion.scroll.startReveal,
              toggleActions: motion.scroll.toggleOnce,
            },
          }
        );
      }

      if (mediaInner) {
        gsap.fromTo(
          mediaInner,
          { yPercent: -motion.parallax.yPercent * 0.22, scale: 1.06 },
          {
            yPercent: motion.parallax.yPercent * 0.22,
            scale: 1,
            immediateRender: false,
            ease: motion.ease.none,
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: motion.parallax.scrubSmooth,
            },
          }
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about-thomas section" aria-labelledby="about-thomas-heading" ref={sectionRef}>
      <div className="container about-thomas__container">
        <div className="about-thomas__mediaWrap" data-about-reveal>
          <div ref={mediaInnerRef} className="about-thomas__mediaInner">
            <ContentImage
              src={portraitSrc}
              alt="Portrait de Thomas Palmier, journaliste sportif"
              fill
              priority={false}
              sizes="(max-width: 980px) 100vw, 46vw"
              className="about-thomas__media"
            />
          </div>
          <div className="about-thomas__mediaScrim" aria-hidden="true" />
        </div>

        <div className="about-thomas__copy">
          <p className="home-sectionEyebrow" data-about-reveal>
            À propos
          </p>
          <h2 id="about-thomas-heading" className="about-thomas__title" data-about-reveal>
            Qui est Thomas Palmier
          </h2>
          <p className="about-thomas__bio" data-about-reveal>
            Journaliste sportif indépendant, Thomas Palmier couvre le sport au plus près du terrain.
            Son approche mêle narration, contexte et regard critique pour transformer un match en récit.
          </p>

          <div className="about-thomas__specs" data-about-reveal>
            <span className="about-thomas__specLabel">Spécialités</span>
            <ul className="about-thomas__specList" aria-label="Spécialités éditoriales">
              <li>Football</li>
              <li>Analyse</li>
              <li>Reportage</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
