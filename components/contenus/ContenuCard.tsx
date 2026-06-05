"use client";

import gsap from "gsap";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Content, ContentType } from "../../types/content";
import { AudioPlayer } from "../media/AudioPlayer";
import { ContentImage } from "../media/ContentImage";
import { VideoPlayer } from "../media/VideoPlayer";
import { articleExcerpt, plainBodyTeaser } from "../../lib/articleExcerpt";
import { extractYouTubeId } from "../../lib/youtube";
import { isReducedMotion, motion } from "../../lib/gsapMotion";

const typeLabels: Record<ContentType, string> = {
  video: "Vidéo",
  article: "Publication",
  audio: "Audio",
};

/**
 * Carte catalogue : média seul (zone 16/9), texte et actions en dessous — style média premium.
 */
export function ContenuCard({ item, intentRail }: { item: Content; intentRail?: boolean }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);

  const isVideo = item.type === "video";
  const isAudio = item.type === "audio";
  const isArticle = item.type === "article";
  const ytId = isVideo ? extractYouTubeId(item.content) : null;
  const canPreview = isVideo && !ytId && Boolean(item.content);
  const excerpt = isArticle ? articleExcerpt(item.content) : "";
  const videoTeaser = isVideo && !ytId ? plainBodyTeaser(item.content, 100) : "";

  useEffect(() => {
    if (isAudio) return;
    const root = rootRef.current;
    const tilt = tiltRef.current;
    if (!root || !tilt || isReducedMotion()) return;

    const fine = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    if (!fine) {
      gsap.set(tilt, { clearProps: "transform" });
      return;
    }

    gsap.set(tilt, { transformPerspective: 960 });

    const qrx = gsap.quickTo(tilt, "rotationX", { duration: 0.55, ease: motion.ease.out });
    const qry = gsap.quickTo(tilt, "rotationY", { duration: 0.55, ease: motion.ease.out });
    const qy = gsap.quickTo(tilt, "y", { duration: 0.42, ease: motion.ease.out });
    const qz = gsap.quickTo(tilt, "z", { duration: 0.5, ease: motion.ease.out });

    const tiltShadowRgb = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--shadow-tilt-rgb").trim() || "0 0 0";

    const shadowFor = (px: number, py: number) => {
      const ox = px * -38;
      const oy = 12 + py * 26;
      const blur = 24 + Math.abs(px) * 36 + Math.abs(py) * 14;
      const light = document.documentElement.getAttribute("data-theme") === "light";
      const alpha = light ? 0.12 + (Math.abs(px) + Math.abs(py)) * 0.22 : 0.38 + (Math.abs(px) + Math.abs(py)) * 0.28;
      const cap = light ? 0.42 : 0.72;
      tilt.style.boxShadow = `${ox}px ${oy}px ${blur}px rgb(${tiltShadowRgb()} / ${Math.min(cap, alpha)})`;
    };

    const resetShadow = () => {
      tilt.style.removeProperty("box-shadow");
    };

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      qrx(-py * 12);
      qry(px * 15);
      qy(-6);
      qz(10);
      shadowFor(px, py);
    };

    const onLeave = () => {
      qrx(0);
      qry(0);
      qy(0);
      qz(0);
      resetShadow();
      const v = previewRef.current;
      if (v) {
        gsap.to(v, { autoAlpha: 0, duration: 0.4, ease: motion.ease.out });
        v.pause();
        v.currentTime = 0;
      }
    };

    const onEnter = () => {
      const v = previewRef.current;
      if (!v || !canPreview) return;
      if (v.readyState < 2) v.load();
      v.play().catch(() => {});
      gsap.to(v, { autoAlpha: 1, duration: 0.5, ease: motion.ease.out });
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerenter", onEnter);

    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerenter", onEnter);
      gsap.killTweensOf(tilt);
      if (previewRef.current) gsap.killTweensOf(previewRef.current);
      resetShadow();
      const v = previewRef.current;
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
    };
  }, [canPreview, isAudio]);

  const cardKindClass = isVideo
    ? `contenus-card--video${canPreview ? " contenus-card--videoHasPreview" : ""}`
    : isAudio
      ? "contenus-card--audio"
      : "contenus-card--article";
  const tiltClass = isAudio ? "" : " contenus-card--tilt";

  return (
    <article
      ref={rootRef}
      className={`contenus-card contenus-card--stacked${tiltClass} ${cardKindClass}`.trim()}
      data-content-id={item.id}
    >
      <div ref={tiltRef} className="contenus-card__tiltInner">
        <div
          className={`contenus-card__media${isVideo ? " contenus-card__media--video" : ""}${isArticle ? " contenus-card__media--article" : ""}${isAudio ? " contenus-card__media--audio" : ""}`.trim()}
        >
          {isVideo ? (
            <>
              {canPreview ? (
                <video
                  ref={previewRef}
                  className="contenus-card__preview"
                  src={item.content}
                  poster={item.image_url}
                  muted
                  playsInline
                  loop
                  preload="none"
                  aria-hidden
                  tabIndex={-1}
                />
              ) : null}
              <VideoPlayer
                src={item.content}
                poster={item.image_url}
                title={item.title}
                className="contenus-card__player"
              />
            </>
          ) : isAudio ? (
            item.image_url ? (
              <ContentImage
                src={item.image_url}
                alt=""
                fill
                sizes="(max-width: 960px) 100vw, (max-width: 1200px) 33vw, 380px"
                className="contenus-card__img"
              />
            ) : (
              <div className="contenus-card__audioFallback" aria-hidden="true" />
            )
          ) : item.image_url ? (
            <ContentImage
              src={item.image_url}
              alt={item.title}
              fill
              sizes="(max-width: 960px) 100vw, (max-width: 1200px) 33vw, 380px"
              className="contenus-card__img"
            />
          ) : (
            <div className="contenus-card__articleFallback" aria-hidden="true" />
          )}
        </div>

        <div className="contenus-card__bodyStack">
          <div className="contenus-card__meta">
            <span className="tag tag-muted">{item.tags[0] ?? "Récit"}</span>
            {intentRail ? null : <span className="contenus-card__format">{typeLabels[item.type]}</span>}
          </div>
          <h3 className="contenus-card__title">{item.title}</h3>
          {isArticle && excerpt ? <p className="contenus-card__excerpt">{excerpt}</p> : null}
          {videoTeaser ? <p className="contenus-card__teaser">{videoTeaser}</p> : null}
          {isAudio ? (
            <div className="contenus-card__audioDock contenus-card__audioDock--stacked">
              <AudioPlayer src={item.content} title={item.title} variant="compact" />
            </div>
          ) : null}
          <Link href={`/mes-contenus/${item.id}`} className="contenus-card__readLink">
            {isArticle ? "Lire l'article" : isVideo ? "Voir la vidéo" : "Écouter"}
          </Link>
        </div>
      </div>
    </article>
  );
}
