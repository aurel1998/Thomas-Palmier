"use client";

import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { isReducedMotion, motion } from "../../lib/gsapMotion";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type AudioPlayerProps = {
  src: string;
  title: string;
  className?: string;
  variant?: "default" | "compact";
};

/**
 * Lecteur audio minimal : lecture / pause, barre de progression (scrub),
 * temps courant / total. GSAP : micro-feedback sur le bouton, progression adoucie.
 */
export function AudioPlayer({ src, title, className = "", variant = "default" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const playGlyphRef = useRef<HTMLSpanElement | null>(null);
  const pauseGlyphRef = useRef<HTMLSpanElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const playingRef = useRef(false);
  const seekingRef = useRef(false);
  const rafRef = useRef(0);
  const quickScaleX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  playingRef.current = playing;

  const setProgressVisual = useCallback((ratio: number) => {
    const fill = fillRef.current;
    if (!fill) return;
    const p = Math.min(1, Math.max(0, ratio));
    if (isReducedMotion()) {
      gsap.set(fill, { scaleX: p });
      return;
    }
    if (quickScaleX.current) quickScaleX.current(p);
    else gsap.to(fill, { scaleX: p, duration: 0.35, ease: motion.ease.out });
  }, []);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    gsap.set(fill, { transformOrigin: "left center", scaleX: 0 });
    if (!isReducedMotion()) {
      quickScaleX.current = gsap.quickTo(fill, "scaleX", {
        duration: 0.55,
        ease: motion.ease.out,
      });
    }
    return () => {
      quickScaleX.current = null;
    };
  }, [src]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDuration(a.duration);
        setProgressVisual(a.currentTime / a.duration);
      }
    };
    const onTime = () => {
      if (seekingRef.current) return;
      setCurrent(a.currentTime);
      const d = a.duration;
      if (d > 0 && (isReducedMotion() || !playingRef.current)) {
        setProgressVisual(a.currentTime / d);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      if (!seekingRef.current && a.duration > 0) {
        setProgressVisual(a.currentTime / a.duration);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
      setProgressVisual(0);
    };
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("durationchange", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("durationchange", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [src, setProgressVisual]);

  useEffect(() => {
    if (!playing || isReducedMotion()) return;
    const tick = () => {
      const a = audioRef.current;
      if (a && !seekingRef.current && a.duration > 0) {
        setProgressVisual(a.currentTime / a.duration);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, setProgressVisual]);

  useLayoutEffect(() => {
    const playEl = playGlyphRef.current;
    const pauseEl = pauseGlyphRef.current;
    if (!playEl || !pauseEl) return;
    if (isReducedMotion()) {
      gsap.set(playEl, { autoAlpha: 1, scale: 1 });
      gsap.set(pauseEl, { autoAlpha: 0, scale: 1 });
      return;
    }
    gsap.set(playEl, { autoAlpha: 1, scale: 1 });
    gsap.set(pauseEl, { autoAlpha: 0, scale: 0.92 });
  }, []);

  useEffect(() => {
    const playEl = playGlyphRef.current;
    const pauseEl = pauseGlyphRef.current;
    if (!playEl || !pauseEl) return;
    if (isReducedMotion()) {
      gsap.set(playEl, { autoAlpha: playing ? 0 : 1 });
      gsap.set(pauseEl, { autoAlpha: playing ? 1 : 0 });
      return;
    }
    gsap.to(playEl, {
      autoAlpha: playing ? 0 : 1,
      scale: playing ? 0.88 : 1,
      duration: motion.duration.micro,
      ease: motion.ease.out,
    });
    gsap.to(pauseEl, {
      autoAlpha: playing ? 1 : 0,
      scale: playing ? 1 : 0.88,
      duration: motion.duration.micro,
      ease: motion.ease.out,
    });
  }, [playing]);

  const seekFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    const a = audioRef.current;
    if (!track || !a || !Number.isFinite(a.duration) || a.duration <= 0) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
    setCurrent(a.currentTime);
    setProgressVisual(ratio);
  }, [setProgressVisual]);

  const onTrackPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (!track) return;
      track.setPointerCapture(e.pointerId);
      seekingRef.current = true;
      seekFromClientX(e.clientX);
    },
    [seekFromClientX]
  );

  const onTrackPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!seekingRef.current) return;
      seekFromClientX(e.clientX);
    },
    [seekFromClientX]
  );

  const onTrackPointerUp = useCallback(() => {
    seekingRef.current = false;
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    const btn = toggleRef.current;
    if (!a) return;
    if (!isReducedMotion() && btn) {
      gsap.fromTo(
        btn,
        { scale: 1 },
        {
          scale: 0.9,
          duration: motion.duration.uiPress,
          yoyo: true,
          repeat: 1,
          ease: motion.ease.out,
        }
      );
    }
    if (a.paused) void a.play().catch(() => {});
    else a.pause();
  }, []);

  const rootClass = `audio-player${variant === "compact" ? " audio-player--compact" : ""}${className ? ` ${className}` : ""}`.trim();
  const durationLabel = duration != null ? formatTime(duration) : "—:—";

  return (
    <div className={rootClass}>
      <audio ref={audioRef} src={src} preload="metadata" className="audio-player__native" aria-label={title} />
      <div className="audio-player__row">
        <button
          ref={toggleRef}
          type="button"
          className="audio-player__toggle is-pressable"
          onClick={toggle}
          aria-label={playing ? "Pause" : `Lecture : ${title}`}
        >
          <span ref={playGlyphRef} className="audio-player__glyph audio-player__glyph--play" aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M8 5.14v13.72L19 12 8 5.14z" />
            </svg>
          </span>
          <span ref={pauseGlyphRef} className="audio-player__glyph audio-player__glyph--pause" aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
            </svg>
          </span>
        </button>

        <div
          ref={trackRef}
          className="audio-player__track"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration ?? 0}
          aria-valuenow={Math.round(current)}
          aria-label={`Progression : ${title}`}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerUp}
          onPointerCancel={onTrackPointerUp}
        >
          <div ref={fillRef} className="audio-player__fill" aria-hidden />
        </div>

        <span className="audio-player__times" aria-live="polite">
          <span className="audio-player__elapsed">{formatTime(current)}</span>
          <span className="audio-player__sep" aria-hidden>
            /
          </span>
          <span className="audio-player__total">{durationLabel}</span>
        </span>
      </div>
    </div>
  );
}
