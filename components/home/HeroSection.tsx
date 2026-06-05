"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import { ContentImage } from "../media/ContentImage";
import { ensureScrollTrigger, isReducedMotion, motion, motionPresets } from "../../lib/gsapMotion";
import { prefersSaveData } from "../../lib/clientPerf";
export type HeroSectionProps = {
  /** Image poster (LCP) + secours si vidéo indisponible. */
  backdropSrc?: string;
  /** Vignette profil journaliste (branding personnel). */
  profileImageSrc?: string;
  /** Source MP4 principale (URL ou /videos/....mp4). */
  videoSrc?: string;
  displayName?: string;
  jobTitle?: string;
  tagline?: string;
};

export function HeroSection({
  backdropSrc,
  profileImageSrc,
  videoSrc,
  displayName = "",
  jobTitle = "",
  tagline = "",
}: HeroSectionProps) {
  const heroNameParts = displayName.trim().split(/\s+/).filter(Boolean);
  const heroFirstName = heroNameParts[0] ?? displayName;
  const heroLastName = heroNameParts.slice(1).join(" ");
  const sectionRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const floatRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const charsRef = useRef<HTMLElement[]>([]);

  const [mounted, setMounted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(videoSrc ?? "");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentVideoSrc(videoSrc ?? "");
    setVideoFailed(false);
  }, [videoSrc]);

  const hasVideo = Boolean(currentVideoSrc?.trim());
  const hasPoster = Boolean(backdropSrc?.trim());
  const videoAllowed = mounted && !isReducedMotion() && !prefersSaveData();
  const showVideo = hasVideo && videoAllowed && !videoFailed;

  const handleVideoError = () => {
    /* Une seule source MP4 : en cas d’échec, poster statique (pas de bascule vers l’autre fichier). */
    setVideoFailed(true);
  };

  useEffect(() => {
    if (!showVideo) return;
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      // Certains navigateurs refusent parfois l'autoplay même en muted :
      // on garde la vidéo affichée au lieu de forcer un fallback image.
      p.catch(() => {});
    }
  }, [showVideo, backdropSrc, currentVideoSrc]);

  useLayoutEffect(() => {
    const root = sectionRef.current;
    const media = mediaRef.current;
    const overlay = overlayRef.current;
    const float = floatRef.current;
    const headline = headlineRef.current;
    if (!root || !media || !overlay || !float || !headline) return;

    const journal = root.querySelector<HTMLElement>(".home-hero__journalLine");
    const rule = root.querySelector<HTMLElement>(".home-hero__rule");
    const positioning = root.querySelector<HTMLElement>(".home-hero__positioning");
    const actions = root.querySelector<HTMLElement>(".home-hero__actions");
    const scrollBlock = root.querySelector<HTMLElement>(".home-hero__scrollBlock");
    const vignette = root.querySelector<HTMLElement>(".home-hero__vignette");
    const grain = root.querySelectorAll<HTMLElement>(".home-hero__grain");

    if (isReducedMotion()) {
      gsap.set(
        [media, overlay, float, journal, rule, positioning, actions, scrollBlock, vignette, ...grain].filter(Boolean),
        {
          clearProps: "all",
        }
      );
      gsap.set(headline, { clearProps: "all" });
      return;
    }

    let split: { revert: () => void; chars: Element[] } | null = null;
    let tl: gsap.core.Timeline | null = null;
    let cancelled = false;

    gsap.set(media, {
      scale: 1.14,
      y: 56,
      filter: "brightness(0.48) saturate(1.12) contrast(1.14)",
    });
    gsap.set(overlay, { opacity: 0.28 });
    if (vignette) gsap.set(vignette, { opacity: 0.12, scale: 1.08 });
    if (grain.length) gsap.set(grain, { opacity: 0.001 });
    gsap.set(headline, { opacity: 0.001 });
    if (journal) gsap.set(journal, { y: 14, autoAlpha: 0 });
    if (rule) gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });
    if (positioning) gsap.set(positioning, { y: 20, autoAlpha: 0, filter: "blur(6px)" });
    if (actions) gsap.set(actions, { y: 28, autoAlpha: 0 });
    const showScrollHint = typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches;
    if (scrollBlock && showScrollHint) {
      gsap.set(scrollBlock, { y: 16, opacity: 0, visibility: "hidden" });
    }

    void import("gsap/SplitText")
      .then(({ SplitText }) => {
        if (cancelled || !headlineRef.current) return;
        gsap.registerPlugin(SplitText);
        split = new SplitText(headlineRef.current, {
          type: "chars",
          mask: "chars",
          charsClass: "home-hero__char",
          aria: "auto",
        });

        const chars = split.chars as HTMLElement[];
        charsRef.current = chars;
        chars.forEach((charEl) => {
          const t = charEl.textContent ?? "";
          if (/^\s$/.test(t)) {
            charEl.classList.add("home-hero__char--space");
            charEl.innerHTML = "&nbsp;";
          }
        });
        gsap.set(headline, { opacity: 1 });
        gsap.set(chars, {
          yPercent: 118,
          opacity: 0,
          rotateX: -78,
          transformOrigin: "50% 0%",
        });

        tl = gsap.timeline({ defaults: { ease: motion.ease.out } });

        tl.to(
          media,
          {
            scale: 1,
            y: 0,
            filter: "brightness(1) saturate(1.08) contrast(1.05)",
            duration: motionPresets.hero.reveal,
            ease: motion.ease.outExpo,
          },
          0
        )
          .to(overlay, { opacity: 1, duration: 0.95, ease: motion.ease.inOutExpo }, 0)
          .to(vignette, { opacity: 1, scale: 1, duration: 1.05, ease: motion.ease.out }, 0.06)
          .to(grain, { opacity: 1, duration: 0.95, stagger: 0.06, ease: motion.ease.outSoft }, 0.12)
          .to(
            journal,
            { y: 0, autoAlpha: 1, duration: motion.duration.revealMed, ease: motion.ease.out },
            0.08
          )
          .to(
            rule,
            {
              scaleX: 1,
              duration: motion.duration.revealMed + 0.12,
              ease: motion.ease.inOut,
            },
            0.14
          )
          .to(
            chars,
            {
              yPercent: 0,
              opacity: 1,
              rotateX: 0,
              duration: motionPresets.hero.text,
              stagger: { each: motion.duration.heroStagger, from: "start" },
              ease: motion.ease.outLux,
            },
            0.18
          )
          .to(
            positioning,
            {
              y: 0,
              autoAlpha: 1,
              filter: "blur(0px)",
              duration: motion.duration.reveal,
              ease: motion.ease.outLux,
            },
            "-=0.46"
          )
          .to(
            actions,
            { y: 0, autoAlpha: 1, duration: motion.duration.revealMed, ease: motion.ease.out },
            "-=0.42"
          );

        if (actions) {
          gsap.fromTo(
            actions.querySelectorAll(".btn"),
            { boxShadow: "0 0 0 rgba(0,0,0,0)" },
            {
              boxShadow: "0 16px 42px rgb(var(--accent-rgb) / 0.34)",
              duration: 1.05,
              ease: motion.ease.outSoft,
              delay: 0.36,
            }
          );
        }

        if (scrollBlock && showScrollHint) {
          tl.to(
            scrollBlock,
            {
              y: 0,
              opacity: 0.55,
              visibility: "visible",
              duration: motion.duration.reveal,
              ease: motion.ease.out,
            },
            "-=0.36"
          );
        }
      })
      .catch(() => {
        if (cancelled || !headlineRef.current) return;
        gsap.set(headlineRef.current, { opacity: 1 });
        tl = gsap.timeline({ defaults: { ease: motion.ease.out } });
        tl.to(overlay, { opacity: 1, duration: 0.6 }, 0)
          .to(media, { scale: 1, y: 0, duration: motion.duration.heroMedia, ease: motion.ease.outExpo }, 0)
          .to(journal, { y: 0, autoAlpha: 1, duration: motion.duration.revealFast }, 0.12)
          .to(
            headlineRef.current,
            { opacity: 1, y: 0, duration: motion.duration.heroChars, ease: motion.ease.outLux },
            0.18
          )
          .to(positioning, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: motion.duration.revealMed }, "-=0.3")
          .to(actions, { y: 0, autoAlpha: 1, duration: motion.duration.revealFast }, "-=0.22");
      });

    return () => {
      cancelled = true;
      tl?.kill();
      split?.revert();
      charsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (isReducedMotion()) return;
    const section = sectionRef.current;
    const media = mediaRef.current;
    const overlay = overlayRef.current;
    const float = floatRef.current;
    if (!section || !media) return;

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        media,
        { scale: 1, y: 0 },
        {
          scale: 1.08,
          y: -36,
          ease: motion.ease.none,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: motion.parallax.scrubSmooth,
          },
        }
      );

      if (float) {
        gsap.to(float, {
          y: -22,
          opacity: 0.84,
          ease: motion.ease.none,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: motion.parallax.scrub,
          },
        });
      }

      if (overlay) {
        gsap.fromTo(
          overlay,
          { opacity: 1 },
          {
            opacity: 0.8,
            ease: motion.ease.none,
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: motion.parallax.scrub,
            },
          }
        );
      }

      if (charsRef.current.length) {
        gsap.fromTo(
          charsRef.current,
          { yPercent: 0, rotateX: 0 },
          {
            yPercent: -18,
            rotateX: 8,
            ease: motion.ease.none,
            stagger: { each: 0.01, from: "center" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: motion.parallax.scrub,
            },
          }
        );
      }

      if (floatRef.current) {
        gsap.to(floatRef.current, {
          y: -6,
          duration: 2.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
    }, section);

    let qx: ReturnType<typeof gsap.quickTo> | null = null;
    let qy: ReturnType<typeof gsap.quickTo> | null = null;
    if (floatRef.current && window.matchMedia("(pointer: fine)").matches) {
      const float = floatRef.current;
      qx = gsap.quickTo(float, "x", { duration: motion.duration.sectionParallax, ease: motion.ease.outCrisp });
      qy = gsap.quickTo(float, "y", { duration: motion.duration.sectionParallax, ease: motion.ease.outCrisp });
    }

    const onMove = (e: PointerEvent) => {
      if (!qx || !qy || !floatRef.current) return;
      const r = section.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      qx(px * 22);
      qy(py * 14);
    };

    const onLeave = () => {
      if (qx && qy) {
        qx(0);
        qy(0);
      }
    };

    if (qx && qy) {
      section.addEventListener("pointermove", onMove, { passive: true });
      section.addEventListener("pointerleave", onLeave);
    }

    return () => {
      ctx.revert();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const posterSrc = backdropSrc?.trim() || undefined;

  return (
    <section ref={sectionRef} className="home-hero" aria-label="Accueil — hero">
      <div ref={mediaRef} className="home-hero__media">
        {showVideo ? (
          <video
            ref={videoRef}
            key={currentVideoSrc}
            className="home-hero__video"
            poster={posterSrc}
            muted
            loop
            playsInline
            preload="metadata"
            autoPlay={showVideo}
            aria-hidden
            onError={handleVideoError}
          >
            <source src={currentVideoSrc} type="video/mp4" />
          </video>
        ) : hasPoster ? (
          <ContentImage
            key={posterSrc}
            src={posterSrc!}
            alt=""
            fill
            priority
            quality={85}
            sizes="100vw"
            className="home-hero__video home-hero__video--static"
          />
        ) : null}
      </div>

      <div ref={overlayRef} className="home-hero__overlay" />
      <div className="home-hero__vignette" aria-hidden="true" />
      <div className="home-hero__grain" aria-hidden="true" />
      <div className="home-hero__grain home-hero__grain--fine" aria-hidden="true" />

      <div className="home-hero__content">
        <div ref={floatRef} className="home-hero__float">
          <div className="home-hero__topRow">
            {profileImageSrc ? (
              <span className="home-hero__journalAvatar" aria-hidden="true">
                <ContentImage
                  src={profileImageSrc}
                  alt=""
                  fill
                  sizes="64px"
                  className="home-hero__journalAvatarImg"
                />
              </span>
            ) : null}
            {jobTitle ? <p className="home-hero__journalLine">{jobTitle}</p> : null}
            <span className="home-hero__rule" aria-hidden="true" />
          </div>

          {displayName ? (
            <h1
              ref={headlineRef}
              className="home-hero__title home-hero__title--splitText home-hero__title--name"
              aria-label={displayName}
            >
              <span className="home-hero__nameSlot">{heroFirstName}</span>
              {heroLastName ? <span className="home-hero__nameSlot">{heroLastName}</span> : null}
            </h1>
          ) : (
            <h1 ref={headlineRef} className="home-hero__title home-hero__title--splitText home-hero__title--name" />
          )}

          {tagline ? <p className="home-hero__positioning">{tagline}</p> : null}

          <div className="home-hero__actions">
            <Link
              href="/contenus"
              className="btn btn-primary home-hero__cta is-magnetic is-pressable"
              data-magnetic="0.28"
            >
              Découvrir les contenus
            </Link>
          </div>
        </div>

        <div className="home-hero__scrollBlock" aria-hidden="true">
          <span className="home-hero__scrollLine" />
          <span className="home-hero__scrollLabel">Défiler</span>
        </div>
      </div>
    </section>
  );
}
