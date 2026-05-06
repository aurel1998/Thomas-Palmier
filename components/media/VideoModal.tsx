"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { isReducedMotion, motion } from "../../lib/gsapMotion";
import { isLikelyAudioUrl } from "../../lib/mediaSource";
import { extractYouTubeId, getYouTubeEmbedUrl } from "../../lib/youtube";

type VideoModalProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  title?: string;
  poster?: string;
  /** Si le contenu catalogue est audio sans extension reconnaissable. */
  mediaKind?: "video" | "audio";
};

/**
 * Modale video premium : backdrop flou + fade, contenu zoom leger.
 * - Animations GSAP d'entree/sortie
 * - Fermeture : clic backdrop, bouton X, touche Echap
 * - Lock du scroll body pendant l'ouverture
 * - Iframe YouTube nocookie autoplay ou <video> natif
 */
export function VideoModal({ open, onClose, src, title, poster, mediaKind = "video" }: VideoModalProps) {
  const [mounted, setMounted] = useState(false);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setMounted(true);
    }
  }, [open]);

  // Animations enter / exit
  useEffect(() => {
    if (!mounted) return;
    const backdrop = backdropRef.current;
    const content = contentRef.current;
    if (!backdrop || !content) return;

    if (open) {
      if (isReducedMotion()) {
        gsap.set(backdrop, { opacity: 1 });
        gsap.set(content, { opacity: 1, scale: 1, y: 0 });
        closeBtnRef.current?.focus({ preventScroll: true });
        return;
      }
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(content, { opacity: 0, scale: 0.94, y: 16 });
      gsap.to(backdrop, { opacity: 1, duration: motion.duration.revealFast, ease: motion.ease.outSoft });
      gsap.to(content, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: motion.duration.revealMed,
        ease: motion.ease.out,
        delay: 0.05,
        onComplete: () => {
          closeBtnRef.current?.focus({ preventScroll: true });
        },
      });
      return;
    }

    if (isReducedMotion()) {
      setMounted(false);
      previousFocusRef.current?.focus?.({ preventScroll: true });
      return;
    }

    // fermeture
    gsap.to(content, {
      opacity: 0,
      scale: 0.96,
      y: 6,
      duration: motion.duration.micro,
      ease: motion.ease.inOut,
    });
    gsap.to(backdrop, {
      opacity: 0,
      duration: motion.duration.revealFast,
      ease: motion.ease.inOut,
      onComplete: () => {
        setMounted(false);
        previousFocusRef.current?.focus?.({ preventScroll: true });
      },
    });
  }, [open, mounted]);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  // Touche Echap
  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleKey]);

  if (!mounted) return null;

  const ytId = extractYouTubeId(src);
  const isAudio = mediaKind === "audio" || isLikelyAudioUrl(src);
  const labelTitle = title && title.length ? title : isAudio ? "Lecture audio" : "Lecture video";

  return createPortal(
    <div
      ref={backdropRef}
      className="video-modal"
      role="dialog"
      aria-modal="true"
      aria-label={labelTitle}
      onClick={onClose}
    >
      <div
        ref={contentRef}
        className="video-modal__content"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="video-modal__close"
          onClick={onClose}
          aria-label="Fermer la video"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {title ? <div className="video-modal__title">{title}</div> : null}

        <div className={`video-modal__frame${isAudio ? " video-modal__frame--audio" : ""}`}>
          {ytId ? (
            <iframe
              key={ytId}
              className="video-modal__iframe"
              src={getYouTubeEmbedUrl(ytId, { autoplay: true })}
              title={labelTitle}
              loading="eager"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : isAudio ? (
            <div className="video-modal__audioShell">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster} alt="" className="video-modal__audioCover" />
              ) : (
                <div className="video-modal__audioCover video-modal__audioCover--placeholder" aria-hidden />
              )}
              <audio className="video-modal__audioNative" src={src} controls preload="metadata" />
            </div>
          ) : (
            <video
              className="video-modal__native"
              src={src}
              poster={poster}
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
