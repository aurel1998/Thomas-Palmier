"use client";

import gsap from "gsap";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import type { Content } from "../../types/content";
import { extractYouTubeId } from "../../lib/youtube";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";
import { formatStoryLabel, getStoryChapters } from "../../lib/storyNarrative";
import { AudioPlayer } from "../media/AudioPlayer";
import { ContentImage } from "../media/ContentImage";
import { VideoPlayer } from "../media/VideoPlayer";

type FeatureStorySectionProps = {
  /** Contenu phare : récit principal (souvent le plus récent). */
  story: Content | null;
};

/**
 * Section « Feature Story » : un seul contenu, mise en récit (média pleine largeur,
 * texte narratif, révélations au scroll GSAP).
 */
export function FeatureStorySection({ story }: FeatureStorySectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mediaInnerRef = useRef<HTMLDivElement | null>(null);

  const { lead, chapters } = useMemo(() => {
    if (!story) return { lead: "", chapters: [] as string[] };
    return getStoryChapters(story);
  }, [story]);

  useEffect(() => {
    const root = sectionRef.current;
    const mediaInner = mediaInnerRef.current;
    if (!root || !story) return;

    if (isReducedMotion()) {
      gsap.set(root.querySelectorAll("[data-story-reveal]"), { clearProps: "all" });
      return;
    }

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      const header = root.querySelector(".feature-story__header");
      if (header) {
        gsap.fromTo(
          header,
          { autoAlpha: 0, y: 44 },
          {
            autoAlpha: 1,
            y: 0,
            duration: motion.duration.reveal,
            ease: motion.ease.out,
            scrollTrigger: {
              trigger: header,
              start: motion.scroll.startRevealTight,
              toggleActions: motion.scroll.toggleOnce,
            },
          }
        );
      }

      gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-story-reveal]")).forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 38 },
          {
            autoAlpha: 1,
            y: 0,
            duration: motion.duration.reveal,
            ease: motion.ease.out,
            scrollTrigger: {
              trigger: el,
              start: motion.scroll.startReveal,
              toggleActions: motion.scroll.toggleOnce,
            },
          }
        );
      });

      const chaptersEls = root.querySelectorAll(".feature-story__chapter");
      if (chaptersEls.length) {
        gsap.fromTo(
          chaptersEls,
          { autoAlpha: 0, y: 52 },
          {
            autoAlpha: 1,
            y: 0,
            duration: motion.duration.reveal,
            ease: motion.ease.outLux,
            stagger: motion.duration.stagger,
            scrollTrigger: {
              trigger: root.querySelector(".feature-story__chapters") ?? root,
              start: motion.scroll.startCards,
              toggleActions: motion.scroll.toggleOnce,
            },
          }
        );
      }

      if (mediaInner) {
        gsap.fromTo(
          mediaInner,
          { yPercent: -motion.parallax.yPercent * 0.35 },
          {
            yPercent: motion.parallax.yPercent * 0.35,
            ease: motion.ease.none,
            scrollTrigger: {
              trigger: root.querySelector(".feature-story__mediaStage") ?? root,
              start: "top bottom",
              end: "bottom top",
              scrub: motion.parallax.scrubSmooth,
            },
          }
        );
      }
    }, root);

    return () => ctx.revert();
  }, [story?.id]);

  if (!story) return null;

  const videoAmbient = story.type === "video";

  return (
    <section
      ref={sectionRef}
      className="feature-story"
      id="recit"
      aria-labelledby="feature-story-heading"
    >
      <div className="feature-story__mediaStage">
        <div ref={mediaInnerRef} className="feature-story__mediaInner">
          {story.type === "video" ? (
            <>
              <VideoPlayer
                src={story.content}
                poster={story.image_url}
                title={story.title}
                autoplay={videoAmbient}
                hidePlayButton={videoAmbient}
                className="feature-story__player"
              />
              <div className="feature-story__mediaGrain" aria-hidden="true" />
              <div className="feature-story__mediaScrim" aria-hidden="true" />
            </>
          ) : story.image_url ? (
            <>
              <ContentImage
                src={story.image_url}
                alt=""
                fill
                priority
                sizes="100vw"
                className="feature-story__cover"
              />
              <div className="feature-story__mediaGrain" aria-hidden="true" />
              <div className="feature-story__mediaScrim" aria-hidden="true" />
            </>
          ) : (
            <div className="feature-story__coverFallback" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="feature-story__scroll">
        <div className="container feature-story__container">
          <header className="feature-story__header">
            <span className="feature-story__eyebrow">{formatStoryLabel(story.type)}</span>
            <h2 id="feature-story-heading" className="feature-story__title">
              {story.title}
            </h2>
            <p className="feature-story__lead">{lead}</p>
            {story.type === "article" ? (
              <p className="feature-story__progressMeta">Chapitres: {Math.max(chapters.length, 1)} · Lecture immersive</p>
            ) : null}
          </header>

          {story.type === "audio" ? (
            <div className="feature-story__audioBlock" data-story-reveal>
              <AudioPlayer src={story.content} title={story.title} variant="default" />
            </div>
          ) : null}

          {chapters.length > 0 ? (
            <div className="feature-story__chapters">
              {chapters.map((text, i) => (
                <p key={`${story.id}-ch-${i}`} className="feature-story__chapter">
                  {text}
                </p>
              ))}
            </div>
          ) : null}

          <div className="feature-story__cta" data-story-reveal>
            <Link href={`/mes-contenus/${story.id}`} className="btn btn-secondary feature-story__link">
              Voir le contenu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
