"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";

/**
 * MicroInteractions : moteur unique (monte 1x dans le layout racine) qui
 * orchestre 3 effets cinematographiques via **event delegation** pure —
 * aucun listener par element, aucun MutationObserver :
 *
 *   1. SPOTLIGHT : un halo radial accent suit le curseur sur les cards
 *      `.contenus-card`, `.contenus-feature`, `.admin-card`. On met a jour
 *      les CSS vars `--mx`/`--my` et un
 *      `::after` CSS dessine le halo (voir globals.css).
 *
 *   2. MAGNETIC : les elements `.is-magnetic` se translatent doucement vers
 *      le curseur quand il est a l'interieur de leur bounding box. Le retour
 *      au repos utilise un easing elastic pour un rebond subtil. Intensite
 *      pilotable via `data-magnetic="0.3"` (default 0.25).
 *
 *   3. PRESS : micro-squeeze scale(0.96) + rebond sur `pointerdown` des
 *      elements `.is-pressable`. Un seul handler ecoute sur document.
 *
 * Perf : les `pointermove` sont coalesces en **un seul rAF** par frame pour
 * limiter le travail (spotlight + magnetic au meme tick). Magnetic et press
 * utilisent des durées courtes (`motion.duration.uiSnap` / `uiPress`).
 *
 * Tous les effets respectent `prefers-reduced-motion: reduce` (aucune anim).
 */
const SPOTLIGHT_SELECTOR = ".contenus-card, .contenus-feature, .admin-card";
const MAGNETIC_SELECTOR = ".is-magnetic";
const PRESS_SELECTOR =
  ".is-pressable, .btn, .btn-primary, .btn-secondary, .admin-btn, " +
  ".site-header__navItem, .contenus-filter, .theme-toggle, .admin-tab, " +
  ".social-links__item, " +
  ".collab-ctaBtn, .contact-submit, .video-responsive--clickable";

/** Boutons plein accent : clic plus « mécanique » + rebond discret au relâchement */
const PREMIUM_PRESS_SELECTOR =
  ".btn-primary, .btn-cta, .site-header__cta, .contact-submit, .collab-ctaBtn";

function isPremiumPressTarget(el: Element): boolean {
  if (el.matches(".contact-submit") && (el as HTMLButtonElement).disabled) return false;
  return el.matches(PREMIUM_PRESS_SELECTOR);
}

export function MicroInteractions() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isReducedMotion()) return;

    const runSpotlight = (e: PointerEvent) => {
      if (document.body.getAttribute("data-route-transitioning") === "true") return;
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      const card = target.closest(SPOTLIGHT_SELECTOR) as HTMLElement | null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${mx.toFixed(1)}%`);
      card.style.setProperty("--my", `${my.toFixed(1)}%`);
    };

    const runMagnetic = (e: PointerEvent) => {
      if (document.body.getAttribute("data-route-transitioning") === "true") return;
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      const el = target.closest(MAGNETIC_SELECTOR) as HTMLElement | null;
      if (!el) return;
      const strengthRaw = parseFloat(el.dataset.magnetic ?? "0.25");
      const strength = Number.isFinite(strengthRaw) ? strengthRaw : 0.25;
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, {
        x: relX * strength,
        y: relY * strength,
        duration: motion.duration.uiSnap,
        ease: motion.ease.outCrisp,
        overwrite: "auto",
      });
    };

    let rafMove = 0;
    let lastMove: PointerEvent | null = null;
    const onPointerMoveCoalesced = (e: PointerEvent) => {
      lastMove = e;
      if (rafMove) return;
      rafMove = requestAnimationFrame(() => {
        rafMove = 0;
        const ev = lastMove;
        if (!ev) return;
        runSpotlight(ev);
        runMagnetic(ev);
      });
    };

    const magLeave = (e: PointerEvent) => {
      const from = e.target as HTMLElement | null;
      if (!from || !from.closest) return;
      const el = from.closest(MAGNETIC_SELECTOR) as HTMLElement | null;
      if (!el) return;
      const related = e.relatedTarget as Node | null;
      if (related && el.contains(related)) return;
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: motion.duration.revealFast,
        ease: "power3.out",
        overwrite: "auto",
        clearProps: "x,y",
      });
    };

    const pressDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      const el = target.closest(PRESS_SELECTOR) as HTMLElement | null;
      if (!el) return;
      if (el.matches(".contact-submit") && (el as HTMLButtonElement).disabled) return;
      const premium = isPremiumPressTarget(el);
      gsap.to(el, {
        scale: premium ? 0.962 : 0.972,
        duration: premium ? motion.duration.uiPress * 0.55 : motion.duration.micro * 0.4,
        ease: premium ? motion.ease.outCrisp : motion.ease.outSoft,
        overwrite: "auto",
      });
    };

    const pressUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      const el = target.closest(PRESS_SELECTOR) as HTMLElement | null;
      if (!el) return;
      if (el.matches(".contact-submit") && (el as HTMLButtonElement).disabled) return;
      const premium = isPremiumPressTarget(el);
      gsap.to(el, {
        scale: 1,
        duration: premium ? motion.duration.uiSnap + 0.14 : motion.duration.uiSnap + 0.06,
        ease: premium ? "back.out(2.15)" : motion.ease.out,
        overwrite: "auto",
        clearProps: premium ? undefined : "scale",
      });
    };

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    /* Sur tactile : pas de suivi global souris → moins de GSAP / getBoundingClientRect */
    if (finePointer) {
      document.addEventListener("pointermove", onPointerMoveCoalesced, { passive: true });
      document.addEventListener("pointerout", magLeave, { passive: true });
    }
    document.addEventListener("pointerdown", pressDown, { passive: true });
    document.addEventListener("pointerup", pressUp, { passive: true });
    document.addEventListener("pointercancel", pressUp, { passive: true });

    return () => {
      cancelAnimationFrame(rafMove);
      if (finePointer) {
        document.removeEventListener("pointermove", onPointerMoveCoalesced);
        document.removeEventListener("pointerout", magLeave);
      }
      document.removeEventListener("pointerdown", pressDown);
      document.removeEventListener("pointerup", pressUp);
      document.removeEventListener("pointercancel", pressUp);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isReducedMotion()) return;

    ensureScrollTrigger();

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".home-une, .home-recent, .contact-wrap, .collab-biz__hero, .apropos-page .story-section"
      )
    );
    if (!sections.length) return;

    const tweens = sections.map((section) =>
      gsap.fromTo(
        section,
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          duration: motion.duration.reveal,
          ease: motion.ease.out,
          scrollTrigger: {
            trigger: section,
            start: motion.scroll.startReveal,
            toggleActions: motion.scroll.toggleOnce,
          },
        }
      )
    );

    return () => {
      tweens.forEach((tw) => tw.kill());
    };
  }, []);

  return null;
}
