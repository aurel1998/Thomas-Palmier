"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { isReducedMotion, motion } from "../../lib/gsapMotion";
import { useTheme } from "./ThemeProvider";

/**
 * Bouton de bascule dark / light.
 *
 * UX :
 *   - Icone soleil / lune qui crossfade avec rotation (GSAP).
 *   - Au clic : un cercle de l'ancien fond se retracte depuis la position du
 *     bouton, revelant la nouvelle palette qui "emane" du toggle — pattern
 *     premium type Vercel / Linear.
 *   - Lock pendant l'anim pour eviter les double-clics.
 *   - Respecte prefers-reduced-motion (switch instantane).
 *
 * Accessibilite :
 *   - bouton natif, aria-label dynamique, focus-visible.
 *   - overlay de transition en pointer-events:none, aria-hidden.
 */

const TRANSITION_DURATION = 0.75;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cree l'overlay plein-ecran utilise pour l'effet de reveal radial. */
function createOverlay(bg: string, x: number, y: number, radius: number) {
  const overlay = document.createElement("div");
  overlay.className = "theme-transition-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.setProperty("--x", `${x}px`);
  overlay.style.setProperty("--y", `${y}px`);
  overlay.style.setProperty("--r", `${radius}px`);
  overlay.style.background = bg;
  document.body.appendChild(overlay);
  return overlay;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const sunRef = useRef<HTMLSpanElement | null>(null);
  const moonRef = useRef<HTMLSpanElement | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* --- Anim GSAP des icones quand le theme change ---------------------- */
  useEffect(() => {
    if (!mounted) return;
    const isDark = theme === "dark";
    const incoming = isDark ? moonRef.current : sunRef.current;
    const outgoing = isDark ? sunRef.current : moonRef.current;
    if (!incoming || !outgoing) return;

    gsap.to(outgoing, {
      opacity: 0,
      scale: 0.5,
      rotate: isDark ? -60 : 60,
      duration: motion.duration.revealFast,
      ease: motion.ease.inOut,
    });
    gsap.fromTo(
      incoming,
      { opacity: 0, scale: 0.5, rotate: isDark ? 60 : -60 },
      {
        opacity: 1,
        scale: 1,
        rotate: 0,
        duration: motion.duration.revealMed,
        ease: "back.out(1.55)",
        delay: 0.1,
      }
    );
  }, [theme, mounted]);

  /* --- Click : reveal radial + switch theme ---------------------------- */
  const handleClick = useCallback(() => {
    if (isAnimatingRef.current) return;
    const btn = btnRef.current;
    if (!btn) {
      toggleTheme();
      return;
    }

    if (isReducedMotion()) {
      toggleTheme();
      return;
    }

    /* View Transitions API : crossfade document fluide — pas d’overlay radial. */
    if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
      toggleTheme();
      gsap.fromTo(
        btn,
        { scale: 1 },
        { scale: 0.94, duration: motion.duration.micro, yoyo: true, repeat: 1, ease: motion.ease.inOut }
      );
      return;
    }

    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const maxR = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    /* Capture la couleur de fond COURANTE (ancien theme) avant le switch */
    const currentBg = getComputedStyle(document.documentElement)
      .getPropertyValue("--bg")
      .trim() || "#141414";

    isAnimatingRef.current = true;
    const overlay = createOverlay(currentBg, x, y, maxR);

    /* Toggle le theme IMMEDIATEMENT : la page passe au nouveau theme */
    /* mais l'overlay (ancien fond) la recouvre encore. */
    toggleTheme();

    /* Pulse sur le bouton lui-meme pendant la transition */
    gsap.fromTo(
      btn,
      { scale: 1 },
      { scale: 0.92, duration: motion.duration.micro, yoyo: true, repeat: 1, ease: motion.ease.inOut }
    );

    /* Anime le rayon du clip-path : maxR -> 0 (overlay se retracte, */
    /* revelant le nouveau theme qui "emane" du bouton).              */
    const state = { r: maxR };
    gsap.to(state, {
      r: 0,
      duration: TRANSITION_DURATION,
      ease: motion.ease.inOut,
      onUpdate: () => {
        overlay.style.setProperty("--r", `${state.r}px`);
      },
      onComplete: () => {
        overlay.remove();
        isAnimatingRef.current = false;
      },
    });
  }, [toggleTheme]);

  const isDark = theme === "dark";
  const label = isDark ? "Passer en theme clair" : "Passer en theme sombre";

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`theme-toggle ${className}`.trim()}
      data-theme={theme}
      suppressHydrationWarning
    >
      <span
        ref={sunRef}
        className={`theme-toggle__icon theme-toggle__icon--sun ${
          mounted && !isDark ? "theme-toggle__icon--active" : ""
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 3v2" />
            <path d="M12 19v2" />
            <path d="M3 12h2" />
            <path d="M19 12h2" />
            <path d="M5.6 5.6l1.4 1.4" />
            <path d="M17 17l1.4 1.4" />
            <path d="M5.6 18.4L7 17" />
            <path d="M17 7l1.4-1.4" />
          </g>
        </svg>
      </span>
      <span
        ref={moonRef}
        className={`theme-toggle__icon theme-toggle__icon--moon ${
          mounted && isDark ? "theme-toggle__icon--active" : ""
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4a1 1 0 0 0-1.3-1.2 10 10 0 1 0 13 13A1 1 0 0 0 20 14.5z"
            fill="currentColor"
          />
        </svg>
      </span>
    </button>
  );
}
