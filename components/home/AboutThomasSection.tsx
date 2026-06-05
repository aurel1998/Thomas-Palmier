"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";
import { ContentImage } from "../media/ContentImage";

type AboutThomasSectionProps = {
  portraitSrc?: string;
  displayName?: string;
  eyebrow?: string;
  title?: string;
  bioShort?: string;
  specialties?: string[];
};

export function AboutThomasSection({
  portraitSrc,
  displayName = "",
  eyebrow = "",
  title = "",
  bioShort = "",
  specialties = [],
}: AboutThomasSectionProps) {
  const portraitAlt = displayName.trim()
    ? `Portrait de ${displayName.trim()}`
    : "Portrait";
  const hasPortrait = Boolean(portraitSrc?.trim());
  const hasCopy = Boolean(eyebrow || title || bioShort || specialties.length);
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

  if (!hasPortrait && !hasCopy) return null;

  return (
    <section className="about-thomas section" aria-labelledby="about-thomas-heading" ref={sectionRef}>
      <div className="container about-thomas__container">
        {hasPortrait ? (
          <div className="about-thomas__mediaWrap" data-about-reveal>
            <div ref={mediaInnerRef} className="about-thomas__mediaInner">
              <ContentImage
                src={portraitSrc!}
                alt={portraitAlt}
                fill
                priority={false}
                sizes="(max-width: 980px) 100vw, 46vw"
                className="about-thomas__media"
              />
            </div>
            <div className="about-thomas__mediaScrim" aria-hidden="true" />
          </div>
        ) : null}

        {hasCopy ? (
          <div className="about-thomas__copy">
            {eyebrow ? (
              <p className="home-sectionEyebrow" data-about-reveal>
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 id="about-thomas-heading" className="about-thomas__title" data-about-reveal>
                {title}
              </h2>
            ) : null}
            {bioShort ? (
              <p className="about-thomas__bio" data-about-reveal>
                {bioShort}
              </p>
            ) : null}

            {specialties.length > 0 ? (
              <div className="about-thomas__specs" data-about-reveal>
                <span className="about-thomas__specLabel">Spécialités</span>
                <ul className="about-thomas__specList" aria-label="Spécialités éditoriales">
                  {specialties.map((spec) => (
                    <li key={spec}>{spec}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
