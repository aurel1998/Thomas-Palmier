"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { isReducedMotion, motion } from "../../lib/gsapMotion";
import { useInViewOnce } from "../../hooks/useInViewOnce";
import {
  extractYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnail,
} from "../../lib/youtube";
import { normalizeMediaSource } from "../../lib/mediaSource";
import { ContentImage } from "./ContentImage";

type AmbientInlineVideoProps = {
  src: string;
  poster?: string;
  className: string;
};

type AmbientInlineYouTubeProps = {
  ytId: string;
  poster?: string;
  className: string;
  title?: string;
};

/** MP4 ambiance : poster jusqu’au viewport, puis `preload="none"` + `load()` pour limiter le réseau. */
function AmbientInlineVideo({ src, poster, className }: AmbientInlineVideoProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 901px)").matches;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(Boolean(entry?.isIntersecting));
      },
      { root: null, threshold: 0.28, rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!inView) {
      v.pause();
      return;
    }
    v.load();
    void v.play().catch(() => {});
  }, [inView]);

  return (
    <div ref={wrapRef} className={className}>
      {inView ? (
        <video
          ref={videoRef}
          className="video-responsive__native"
          src={src}
          poster={poster}
          muted
          loop={desktop}
          playsInline
          preload="none"
          autoPlay
        />
      ) : poster ? (
        <ContentImage
          src={poster}
          alt=""
          fill
          sizes="(max-width: 900px) 100vw, 60vw"
          className="video-responsive__native video-responsive__native--poster"
        />
      ) : (
        <span className="video-responsive__placeholder" aria-hidden="true" />
      )}
    </div>
  );
}

/** YouTube ambiance inline : iframe chargée seulement en viewport, autoplay mute/loop. */
function AmbientInlineYouTube({ ytId, poster, className, title }: AmbientInlineYouTubeProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 901px)").matches;
  const embedSrc = getYouTubeEmbedUrl(ytId, {
    autoplay: desktop,
    mute: true,
    loop: desktop,
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(Boolean(entry?.isIntersecting));
      },
      { root: null, threshold: 0.28, rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      {inView ? (
        <iframe
          className="video-responsive__native video-responsive__native--youtubeAmbient"
          src={embedSrc}
          title={title ?? "Video"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : poster ? (
        <ContentImage
          src={poster}
          alt=""
          fill
          sizes="(max-width: 900px) 100vw, 60vw"
          className="video-responsive__native video-responsive__native--poster"
        />
      ) : (
        <span className="video-responsive__placeholder" aria-hidden="true" />
      )}
    </div>
  );
}

type VideoPlayerProps = {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  /**
   * Pour les videos directes (MP4), lance automatiquement en mode mute/loop inline
   * (utilise pour une lecture d'ambiance dans la section "A la une").
   * Ignore pour YouTube (les navigateurs bloquent l'autoplay iframe).
   */
  autoplay?: boolean;
  /**
   * Cache le bouton de lecture (utile quand autoplay=true sur une video MP4).
   */
  hidePlayButton?: boolean;
};

/**
 * VideoPlayer premium :
 * - Affiche une thumbnail (poster ou vignette YouTube auto)
 * - Bouton play custom au centre, avec halo anime
 * - Clic -> lecture inline dans le meme bloc (pas de modale)
 *
 * Perf : MP4 inline charge seulement en viewport ; vignettes via next/image ;
 * pulse play seulement quand le bouton est visible.
 */
export function VideoPlayer({
  src,
  poster,
  title,
  className,
  autoplay = false,
  hidePlayButton = false,
}: VideoPlayerProps) {
  const mediaSrc = normalizeMediaSource(src);
  const ytId = extractYouTubeId(mediaSrc);
  const thumb = poster || (ytId ? getYouTubeThumbnail(ytId, "max") : undefined);
  const [playingInline, setPlayingInline] = useState(false);
  const [displayThumb, setDisplayThumb] = useState<string | undefined>(thumb);
  const pulseRef = useRef<HTMLSpanElement | null>(null);
  const playBtnRef = useRef<HTMLButtonElement | null>(null);
  const btnInView = useInViewOnce(playBtnRef, "100px", 0.02);

  useEffect(() => {
    if (playingInline || !btnInView) return;
    const el = pulseRef.current;
    if (!el) return;
    if (isReducedMotion()) return;

    const tl = gsap.to(el, {
      scale: 1.35,
      opacity: 0,
      duration: 1.85,
      ease: motion.ease.outSoft,
      repeat: -1,
      repeatDelay: 0.15,
    });
    return () => {
      tl.kill();
    };
  }, [playingInline, btnInView]);

  useEffect(() => {
    setDisplayThumb(thumb);
  }, [thumb]);

  const rootClass = `video-responsive ${className ?? ""}`.trim();

  // --- Mode ambiance inline (MP4 atmosphérique, ex. sections catalogue) ---
  if (autoplay && !ytId) {
    return <AmbientInlineVideo src={mediaSrc} poster={poster} className={rootClass} />;
  }
  if (autoplay && ytId) {
    return <AmbientInlineYouTube ytId={ytId} poster={displayThumb} className={rootClass} title={title} />;
  }

  // --- Mode click-to-play inline ----------------------------------
  const labelTitle = title && title.length ? title : "la video";

  return (
    <div className={rootClass}>
      {playingInline ? (
        ytId ? (
          <iframe
            className="video-responsive__iframe"
            src={getYouTubeEmbedUrl(ytId, { autoplay: true, mute: false })}
            title={labelTitle}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <video
            className="video-responsive__native"
            src={mediaSrc}
            poster={poster}
            controls
            autoPlay
            muted={false}
            playsInline
            preload="metadata"
          />
        )
      ) : (
        <button
          ref={playBtnRef}
          type="button"
          className="video-responsive__launch video-responsive--clickable"
          onClick={() => setPlayingInline(true)}
          aria-label={`Lire ${labelTitle}`}
        >
          {displayThumb ? (
            <Image
              src={displayThumb}
              alt={title ?? ""}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="video-responsive__poster"
              loading="lazy"
              draggable={false}
              onError={() => {
                if (!ytId) return;
                const fallback = getYouTubeThumbnail(ytId, "hq");
                setDisplayThumb((cur) => (cur !== fallback ? fallback : cur));
              }}
            />
          ) : (
            <span className="video-responsive__placeholder" aria-hidden="true" />
          )}

          <span className="video-responsive__gradient" aria-hidden="true" />

          {hidePlayButton ? null : (
            <span className="video-responsive__playWrap" aria-hidden="true">
              <span ref={pulseRef} className="video-responsive__pulse" />
              <span className="video-responsive__play">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M8 5.14v13.72L19 12 8 5.14z" />
                </svg>
              </span>
            </span>
          )}
        </button>
      )}
    </div>
  );
}
